import { ClassRecord, MicroProfileRecord, Mutation, ScheduleRecord } from '../sync/types';

export interface SqliteStatementResult { rowsAffected?: number; rows?: { length: number; item(index: number): Record<string, unknown> }; }
export interface SqliteTransaction {
  executeSql(sql: string, params?: unknown[]): Promise<SqliteStatementResult>;
}
export interface SqliteDatabase {
  transaction<T>(callback: (transaction: SqliteTransaction) => Promise<T>): Promise<T>;
}

export const OFFLINE_SCHEMA = [
  'CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS schedules (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, pending_sync INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS micro_profiles (id TEXT PRIMARY KEY, class_id TEXT NOT NULL, student_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS mutations (id TEXT PRIMARY KEY, operation TEXT NOT NULL, entity_id TEXT NOT NULL, payload TEXT NOT NULL, client_updated_at TEXT NOT NULL, attempts INTEGER NOT NULL, state TEXT NOT NULL, last_error TEXT)',
  'CREATE INDEX IF NOT EXISTS idx_mutations_state ON mutations (state, client_updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_schedules_user_due ON schedules (user_id, updated_at)',
];

export class OfflineRepository {
  constructor(private readonly database: SqliteDatabase) {}

  async initialize(): Promise<void> {
    await this.database.transaction(async (transaction) => {
      for (const statement of OFFLINE_SCHEMA) await transaction.executeSql(statement);
    });
  }

  async saveClass(record: ClassRecord): Promise<void> {
    await this.database.transaction((transaction) => transaction.executeSql(
      'INSERT INTO classes (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at WHERE excluded.updated_at >= classes.updated_at',
      [record.id, JSON.stringify(record), record.updatedAt],
    ).then(() => undefined));
  }

  async saveSchedule(record: ScheduleRecord): Promise<void> {
    await this.database.transaction((transaction) => transaction.executeSql(
      'INSERT INTO schedules (id, user_id, payload, updated_at, pending_sync) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at, pending_sync=excluded.pending_sync WHERE excluded.updated_at >= schedules.updated_at',
      [record.id, record.userId, JSON.stringify(record), record.updatedAt, record.pendingSync ? 1 : 0],
    ).then(() => undefined));
  }

  async enqueueMutation<T>(mutation: Mutation<T>): Promise<void> {
    await this.database.transaction((transaction) => transaction.executeSql(
      'INSERT OR REPLACE INTO mutations (id, operation, entity_id, payload, client_updated_at, attempts, state, last_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [mutation.id, mutation.operation, mutation.entityId, JSON.stringify(mutation.payload), mutation.clientUpdatedAt, mutation.attempts, mutation.state, mutation.lastError ?? null],
    ).then(() => undefined));
  }

  async saveMicroProfile(record: MicroProfileRecord): Promise<void> {
    await this.database.transaction((transaction) => transaction.executeSql(
      'INSERT INTO micro_profiles (id, class_id, student_id, payload, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at WHERE excluded.updated_at >= micro_profiles.updated_at',
      [record.id, record.classId, record.studentId, JSON.stringify(record), record.updatedAt],
    ).then(() => undefined));
  }

  async pendingMutations(limit = 50): Promise<Mutation[]> {
    let rows: Record<string, unknown>[] = [];
    await this.database.transaction(async (transaction) => {
      const result = await transaction.executeSql('SELECT * FROM mutations WHERE state IN (?, ?) ORDER BY client_updated_at ASC LIMIT ?', ['PENDING', 'FAILED', limit]);
      rows = Array.from({ length: result.rows?.length ?? 0 }, (_, index) => result.rows!.item(index));
    });
    return rows.map((row) => ({
      id: String(row.id), operation: row.operation as Mutation['operation'], entityId: String(row.entity_id),
      payload: JSON.parse(String(row.payload)) as Record<string, unknown>, clientUpdatedAt: String(row.client_updated_at),
      attempts: Number(row.attempts), state: row.state as Mutation['state'], lastError: row.last_error ? String(row.last_error) : undefined,
    }));
  }

  async markMutation(id: string, state: Mutation['state'], attempts: number, lastError?: string): Promise<void> {
    await this.database.transaction((transaction) => transaction.executeSql(
      'UPDATE mutations SET state = ?, attempts = ?, last_error = ? WHERE id = ?',
      [state, attempts, lastError ?? null, id],
    ).then(() => undefined));
  }

  async markScheduleSynced(id: string, serverUpdatedAt: string): Promise<void> {
    const record = await this.readSchedule(id);
    if (record) await this.saveSchedule({ ...record, pendingSync: false, serverUpdatedAt, updatedAt: serverUpdatedAt });
  }

  async applyRemoteSchedule(record: ScheduleRecord): Promise<boolean> {
    const local = await this.readSchedule(record.id);
    if (local && new Date(local.updatedAt).getTime() > new Date(record.updatedAt).getTime()) return false;
    await this.saveSchedule({ ...record, pendingSync: false, serverUpdatedAt: record.updatedAt });
    return true;
  }

  private async readSchedule(_id: string): Promise<ScheduleRecord | null> {
    let row: Record<string, unknown> | undefined;
    await this.database.transaction(async (transaction) => {
      const result = await transaction.executeSql('SELECT payload FROM schedules WHERE id = ?', [_id]);
      row = result.rows?.length ? result.rows.item(0) : undefined;
    });
    return row ? JSON.parse(String(row.payload)) as ScheduleRecord : null;
  }
}
