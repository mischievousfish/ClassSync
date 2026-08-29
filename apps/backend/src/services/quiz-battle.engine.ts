export type LiveSessionStatus = 'WAITING' | 'QUESTION_ACTIVE' | 'LEADERBOARD' | 'ENDED';

export interface LiveClassSession {
  sessionId: string;
  classId: string;
  teacherId: string;
  activeQuizId?: string;
  currentQuestionIndex: number;
  sessionStatus: LiveSessionStatus;
  connectedStudentsMap: Record<string, { displayName?: string; connectedAt: string }>;
}

export interface AnswerSubmission {
  sessionId: string;
  studentId: string;
  questionIndex: number;
  optionIndex: number;
  responseTimeMs: number;
  correct: boolean;
  timeLimitMs: number;
}

export interface PlayerScore { studentId: string; score: number; correctAnswers: number; answeredQuestions: number; }

export class QuizBattleEngine {
  private readonly scores = new Map<string, Map<string, PlayerScore>>();
  private readonly answers = new Set<string>();

  submitAnswer(answer: AnswerSubmission): PlayerScore {
    if (answer.responseTimeMs < 0 || answer.timeLimitMs <= 0) throw new Error('Invalid quiz timing');
    const answerKey = `${answer.sessionId}:${answer.studentId}:${answer.questionIndex}`;
    if (this.answers.has(answerKey)) return this.getScore(answer.sessionId, answer.studentId);
    this.answers.add(answerKey);
    const sessionScores = this.scores.get(answer.sessionId) ?? new Map<string, PlayerScore>();
    this.scores.set(answer.sessionId, sessionScores);
    const current = sessionScores.get(answer.studentId) ?? { studentId: answer.studentId, score: 0, correctAnswers: 0, answeredQuestions: 0 };
    current.answeredQuestions += 1;
    if (answer.correct) { const decay = Math.max(0, 1 - answer.responseTimeMs / (answer.timeLimitMs * 2)); current.score += Math.max(0, Math.round(1000 * decay)); current.correctAnswers += 1; }
    sessionScores.set(answer.studentId, current);
    return { ...current };
  }

  leaderboard(sessionId: string, limit = 5): PlayerScore[] { return [...(this.scores.get(sessionId)?.values() ?? [])].sort((left, right) => right.score - left.score || right.correctAnswers - left.correctAnswers).slice(0, limit).map((score) => ({ ...score })); }
  clear(sessionId: string): void { this.scores.delete(sessionId); for (const key of this.answers) if (key.startsWith(`${sessionId}:`)) this.answers.delete(key); }
  private getScore(sessionId: string, studentId: string): PlayerScore { return { ...(this.scores.get(sessionId)?.get(studentId) ?? { studentId, score: 0, correctAnswers: 0, answeredQuestions: 0 }) }; }
}