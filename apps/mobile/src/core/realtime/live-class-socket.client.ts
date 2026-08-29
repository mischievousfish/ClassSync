import { io, Socket } from 'socket.io-client';

export interface LiveSession { sessionId: string; classId: string; teacherId: string; activeQuizId?: string; currentQuestionIndex: number; sessionStatus: 'WAITING' | 'QUESTION_ACTIVE' | 'LEADERBOARD' | 'ENDED'; connectedStudentsMap: Record<string, { displayName?: string; connectedAt: string }>; }
export interface LeaderboardEntry { studentId: string; score: number; correctAnswers: number; answeredQuestions: number; }

export class LiveClassSocketClient {
  private socket?: Socket;

  connect(baseUrl: string, token: string): void { this.socket = io(baseUrl, { path: '/ws/live-class', auth: { token }, transports: ['websocket'] }); }
  disconnect(): void { this.socket?.disconnect(); this.socket = undefined; }
  joinSession(input: { sessionId: string; classId: string; displayName?: string }) { return this.emitWithAck('join_session', input); }
  submitAnswer(input: { sessionId: string; questionIndex: number; optionIndex: number; responseTimeMs: number; correct: boolean; timeLimitMs: number }) { return this.emitWithAck('submit_answer', input); }
  nextQuestion(input: { sessionId: string; quizId: string; questionIndex: number }) { return this.emitWithAck('teacher_next_question', input); }
  endSession(sessionId: string) { return this.emitWithAck('teacher_end_session', { sessionId }); }
  onQuestionStarted(listener: (value: { quizId: string; questionIndex: number }) => void): () => void { this.socket?.on('question_started', listener); return () => { this.socket?.off('question_started', listener); }; }
  onLeaderboard(listener: (value: { leaderboard: LeaderboardEntry[] }) => void): () => void { this.socket?.on('leaderboard_update', listener); return () => { this.socket?.off('leaderboard_update', listener); }; }
  onPresence(listener: (value: { connectedStudentCount: number }) => void): () => void { this.socket?.on('session_presence', listener); return () => { this.socket?.off('session_presence', listener); }; }
  private emitWithAck<T>(event: string, value: unknown): Promise<T> { return new Promise((resolve, reject) => { if (!this.socket) return reject(new Error('Live socket is not connected')); this.socket.timeout(3000).emit(event, value, (error: Error | null, response: T) => error ? reject(error) : resolve(response)); }); }
}