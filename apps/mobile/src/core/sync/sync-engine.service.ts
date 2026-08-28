import { OfflineRepository } from '../storage/offline-repository';
import { ConnectivityMonitor, Mutation, ScheduleRecord, SyncApiClient } from './types';

export interface SyncEngineOptions { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number; }

export class SyncEngineService {
  private syncing = false;
  private unsubscribe?: () => void;
  private readonly options: Required<SyncEngineOptions>;

  constructor(
    private readonly repository: OfflineRepository,
    private readonly api: SyncApiClient,
    private readonly connectivity: ConnectivityMonitor,
    options: SyncEngineOptions = {},
  ) {
    this.options = { maxAttempts: options.maxAttempts ?? 5, baseDelayMs: options.baseDelayMs ?? 500, maxDelayMs: options.maxDelayMs ?? 30_000 };
  }

  start(): void {
    this.unsubscribe = this.connectivity.subscribe((online) => { if (online) void this.syncNow(); });
    void this.syncNow();
  }

  stop(): void { this.unsubscribe?.(); this.unsubscribe = undefined; }

  async saveOptimistically(record: ScheduleRecord, mutation: Mutation): Promise<void> {
    await this.repository.saveSchedule({ ...record, pendingSync: true });
    await this.repository.enqueueMutation(mutation);
    if (await this.connectivity.isOnline()) await this.syncNow();
  }

  async syncNow(): Promise<void> {
    if (this.syncing || !(await this.connectivity.isOnline())) return;
    this.syncing = true;
    try {
      for (const mutation of await this.repository.pendingMutations()) await this.push(mutation);
    } finally { this.syncing = false; }
  }

  private async push(mutation: Mutation): Promise<void> {
    const attempt = mutation.attempts + 1;
    await this.repository.markMutation(mutation.id, 'IN_FLIGHT', attempt);
    try {
      const result = await this.api.pushMutation(mutation);
      if (result.accepted && result.serverUpdatedAt && (mutation.operation === 'UPSERT_SCHEDULE' || mutation.operation === 'UPSERT_DEADLINE')) {
        await this.repository.markScheduleSynced(mutation.entityId, result.serverUpdatedAt);
      }
      await this.repository.markMutation(mutation.id, result.accepted ? 'SYNCED' : 'FAILED', attempt, result.accepted ? undefined : 'Server rejected mutation');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network sync failed';
      await this.repository.markMutation(mutation.id, attempt >= this.options.maxAttempts ? 'DEAD_LETTER' : 'FAILED', attempt, message);
      if (attempt < this.options.maxAttempts) await this.delay(attempt);
    }
  }

  private async delay(attempt: number): Promise<void> {
    const exponential = Math.min(this.options.maxDelayMs, this.options.baseDelayMs * (2 ** (attempt - 1)));
    const jitter = Math.round(Math.random() * exponential * 0.25);
    await new Promise((resolve) => setTimeout(resolve, exponential + jitter));
  }
}
