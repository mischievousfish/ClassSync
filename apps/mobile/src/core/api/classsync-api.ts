export interface AuthTokenProvider { getIdToken(): Promise<string | null>; }

export interface QuizInput { topic: string; gradeLevel: string; numQuestions: number; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; }
export interface OcrResult { subject: string; assignmentTitle: string; extractedDescription: string; detectedDueDate: string | null; actionItems: string[]; extractedText?: string; }
export interface GamificationProfile { userId: string; currentXP: number; level: number; currentStreakDays: number; longestStreakDays: number; coinsBalance: number; streakFreezeTokens: number; unlockedBadges: string[]; inventoryItems: string[]; }
export interface DailyQuest { id: string; questType: 'COMPLETE_3_DEADLINES' | 'SCAN_1_OCR_ASSIGNMENT' | 'REVIEW_WEAK_TOPIC'; targetCount: number; currentCount: number; xpReward: number; coinReward: number; expiresAt: string; status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED'; }

export class ClassSyncApi {
  constructor(private readonly baseUrl: string, private readonly tokenProvider: AuthTokenProvider) {}

  async parseAssignment(imageBase64: string): Promise<OcrResult> { return this.request<OcrResult>('/ocr/parse-assignment', { method: 'POST', body: JSON.stringify({ imageBase64 }) }); }
  async generateQuiz(input: QuizInput): Promise<unknown> { return this.request('/ai/generate-quiz', { method: 'POST', body: JSON.stringify(input) }); }
  async getGamification(): Promise<{ profile: GamificationProfile | null; quests: DailyQuest[] }> { return this.request('/gamification/profile', { method: 'GET' }); }
  async recordGamificationAction(input: { actionId?: string; type: 'SUBMIT_HOMEWORK' | 'COMPLETE_TASK' | 'REVIEW_AI_QUIZ' | 'SCAN_OCR'; occurredAt?: string; deadlineAt?: string; assignedAt?: string }): Promise<unknown> { return this.request('/gamification/streak', { method: 'POST', body: JSON.stringify(input) }); }
  async purchaseStreakFreeze(): Promise<GamificationProfile> { return this.request('/gamification/streak-freeze/purchase', { method: 'POST', body: JSON.stringify({}) }); }
  async claimQuest(questId: string): Promise<DailyQuest> { return this.request(`/gamification/quests/${encodeURIComponent(questId)}/claim`, { method: 'POST', body: JSON.stringify({}) }); }

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const token = await this.tokenProvider.getIdToken();
    const response = await fetch(`${this.baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) } });
    if (!response.ok) throw new Error(`ClassSync API request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
}
