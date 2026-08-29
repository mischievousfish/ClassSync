import { ClassSyncApi, DailyQuest, GamificationProfile } from '../api/classsync-api';

export interface GamificationSnapshot { profile: GamificationProfile; quests: DailyQuest[]; }

export class GamificationService {
  constructor(private readonly api: ClassSyncApi) {}

  async load(): Promise<GamificationSnapshot | null> {
    const response = await this.api.getGamification();
    return response.profile ? { profile: response.profile, quests: response.quests } : null;
  }

  recordAction(type: 'SUBMIT_HOMEWORK' | 'COMPLETE_TASK' | 'REVIEW_AI_QUIZ' | 'SCAN_OCR', metadata: { deadlineAt?: string; assignedAt?: string } = {}) {
    return this.api.recordGamificationAction({ type, occurredAt: new Date().toISOString(), ...metadata });
  }

  claimQuest(questId: string) { return this.api.claimQuest(questId); }
  purchaseFreeze() { return this.api.purchaseStreakFreeze(); }
}