import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { BadgeMaster, DailyQuest, GamificationActionType, StudentGamificationProfile } from '../models';
import { AppError } from '../shared/errors';

export interface GamificationAction {
  actionId?: string;
  type: GamificationActionType;
  occurredAt?: string;
  deadlineAt?: string;
  assignedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface GamificationAward {
  xp: number;
  coins: number;
  level: number;
  currentStreakDays: number;
  unlockedBadges: string[];
  streakFreezeUsed: boolean;
}

const dayMs = 86_400_000;

function isoDay(value = new Date()): string { return value.toISOString().slice(0, 10); }
function dayDistance(left: string, right: string): number { return Math.round((Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) / dayMs); }
export function xpRequiredForLevel(level: number): number { return Math.ceil(100 * level ** 1.5); }
export function levelForXp(xp: number): number { let level = 1; while (xp >= xpRequiredForLevel(level + 1)) level += 1; return level; }

export class BadgeEvaluatorEngine {
  async evaluate(userId: string, action: GamificationAction, profile: StudentGamificationProfile): Promise<BadgeMaster[]> {
    const snapshot = await db.collection('badges_master').get();
    const actionCountSnapshot = await db.collection('gamification_events').where('userId', '==', userId).where('type', '==', action.type).get();
    const actionCount = actionCountSnapshot.size;
    const unlocked = new Set(profile.unlockedBadges);
    return snapshot.docs.map((document) => document.data() as BadgeMaster).filter((badge) => !unlocked.has(badge.code) && this.matches(badge.conditionRuleJson, action, profile, actionCount));
  }

  private matches(rule: Record<string, unknown>, action: GamificationAction, profile: StudentGamificationProfile, actionCount: number): boolean {
    if (rule.actionType && rule.actionType !== action.type) return false;
    if (typeof rule.minStreakDays === 'number' && profile.currentStreakDays < rule.minStreakDays) return false;
    if (typeof rule.minActionCount === 'number' && actionCount < rule.minActionCount) return false;
    if (rule.beforeHour != null) { const hour = new Date(action.occurredAt ?? new Date()).getUTCHours(); if (hour >= Number(rule.beforeHour)) return false; }
    return true;
  }
}

export class GamificationService {
  constructor(private readonly badgeEvaluator = new BadgeEvaluatorEngine()) {}

  async processAction(userId: string, action: GamificationAction): Promise<GamificationAward> {
    const actionDate = new Date(action.occurredAt ?? new Date().toISOString());
    if (Number.isNaN(actionDate.getTime())) throw new AppError(400, 'occurredAt must be a valid date');
    const reference = db.collection('student_gamification_profiles').doc(userId);
    const actionId = action.actionId ?? `${action.type}_${actionDate.toISOString()}`;
    const eventReference = db.collection('gamification_events').doc(`${userId}_${actionId}`);
    if ((await eventReference.get()).exists) return { xp: 0, coins: 0, level: (await reference.get()).data()?.level ?? 1, currentStreakDays: (await reference.get()).data()?.currentStreakDays ?? 0, unlockedBadges: [], streakFreezeUsed: false };
    let result: GamificationAward | undefined;
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const existing = snapshot.exists ? snapshot.data() as StudentGamificationProfile : { userId, currentXP: 0, level: 1, currentStreakDays: 0, longestStreakDays: 0, coinsBalance: 0, streakFreezeTokens: 0, unlockedBadges: [], inventoryItems: [], updatedAt: Timestamp.now() };
      const today = isoDay(actionDate);
      const previousDay = existing.lastActiveDate ? dayDistance(existing.lastActiveDate, today) : undefined;
      let streak = existing.currentStreakDays;
      let freezeUsed = false;
      if (!existing.lastActiveDate) streak = 1;
      else if (previousDay === 0) streak = existing.currentStreakDays || 1;
      else if (previousDay === 1) streak += 1;
      else if (previousDay === 2 && existing.streakFreezeTokens > 0) { streak += 1; freezeUsed = true; }
      else streak = 1;
      let xp = 10;
      if (action.type === 'SUBMIT_HOMEWORK' && action.deadlineAt && Date.parse(action.deadlineAt) - actionDate.getTime() > dayMs) xp += 50;
      if (action.type === 'SCAN_OCR' && action.assignedAt && isoDay(new Date(action.assignedAt)) === today) xp += 20;
      if (existing.currentStreakDays > 7) xp = Math.round(xp * 1.2);
      const nextProfile: StudentGamificationProfile = { ...existing, userId, currentXP: existing.currentXP + xp, level: levelForXp(existing.currentXP + xp), currentStreakDays: streak, longestStreakDays: Math.max(existing.longestStreakDays, streak), lastActiveDate: today, streakFreezeTokens: existing.streakFreezeTokens - (freezeUsed ? 1 : 0), updatedAt: FieldValue.serverTimestamp() as never };
      transaction.set(reference, nextProfile, { merge: true });
      transaction.create(eventReference, { userId, actionId, type: action.type, occurredAt: actionDate.toISOString(), createdAt: FieldValue.serverTimestamp() });
      result = { xp, coins: 0, level: nextProfile.level, currentStreakDays: streak, unlockedBadges: [], streakFreezeUsed: freezeUsed };
    });
    if (!result) throw new AppError(500, 'Gamification transaction failed');
    const profile = (await reference.get()).data() as StudentGamificationProfile;
    const badges = await this.badgeEvaluator.evaluate(userId, action, profile);
    if (badges.length) {
      const badgeXp = badges.reduce((sum, badge) => sum + badge.xpReward, 0);
      await reference.update({ unlockedBadges: FieldValue.arrayUnion(...badges.map((badge) => badge.code)), currentXP: FieldValue.increment(badgeXp), level: levelForXp(profile.currentXP + badgeXp), updatedAt: FieldValue.serverTimestamp() });
      result.xp += badgeXp;
      result.level = levelForXp(profile.currentXP + badgeXp);
      result.unlockedBadges = badges.map((badge) => badge.code);
    }
    await this.updateQuestProgress(userId, action, result.xp);
    return result;
  }

  async purchaseStreakFreeze(userId: string, cost = 100): Promise<StudentGamificationProfile> {
    const reference = db.collection('student_gamification_profiles').doc(userId);
    const profile = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new AppError(404, 'Gamification profile was not found');
      const current = snapshot.data() as StudentGamificationProfile;
      if (current.coinsBalance < cost) throw new AppError(400, 'Not enough coins for a streak freeze');
      transaction.update(reference, { coinsBalance: FieldValue.increment(-cost), streakFreezeTokens: FieldValue.increment(1), inventoryItems: FieldValue.arrayUnion('STREAK_FREEZE') });
      return { ...current, coinsBalance: current.coinsBalance - cost, streakFreezeTokens: current.streakFreezeTokens + 1 };
    });
    return profile;
  }

  async claimQuest(userId: string, questId: string): Promise<DailyQuest> {
    const reference = db.collection('quests_daily').doc(questId);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists || snapshot.data()?.userId !== userId) throw new AppError(404, 'Quest was not found');
      const quest = snapshot.data() as DailyQuest;
      if (quest.status !== 'COMPLETED') throw new AppError(400, 'Quest is not completed');
      transaction.update(reference, { status: 'CLAIMED' });
      transaction.update(db.collection('student_gamification_profiles').doc(userId), { currentXP: FieldValue.increment(quest.xpReward), coinsBalance: FieldValue.increment(quest.coinReward) });
      return { ...quest, status: 'CLAIMED' };
    });
  }

  private async updateQuestProgress(userId: string, action: GamificationAction, awardXp: number): Promise<void> {
    const mapping: Partial<Record<GamificationActionType, DailyQuest['questType']>> = { SUBMIT_HOMEWORK: 'COMPLETE_3_DEADLINES', SCAN_OCR: 'SCAN_1_OCR_ASSIGNMENT', REVIEW_AI_QUIZ: 'REVIEW_WEAK_TOPIC' };
    const questType = mapping[action.type]; if (!questType) return;
    const snapshot = await db.collection('quests_daily').where('userId', '==', userId).where('questType', '==', questType).where('status', '==', 'IN_PROGRESS').limit(10).get();
    await Promise.all(snapshot.docs.map((document) => { const quest = document.data() as DailyQuest; const currentCount = Math.min(quest.targetCount, quest.currentCount + 1); return document.ref.update({ currentCount, status: currentCount >= quest.targetCount ? 'COMPLETED' : 'IN_PROGRESS', lastAwardedXp: awardXp }); }));
  }
}