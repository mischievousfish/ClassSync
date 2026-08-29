import { createServer, Server as HttpServer } from 'node:http';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { QuizBattleEngine, AnswerSubmission, LiveClassSession } from './quiz-battle.engine';

interface LiveSocket extends Socket { user?: { id: string; role?: string }; }

export class LiveClassSocketHandler {
  private readonly sessions = new Map<string, LiveClassSession>();
  private readonly quiz = new QuizBattleEngine();
  private io?: Server;

  async attach(httpServer: HttpServer): Promise<Server> {
    const io = new Server(httpServer, { path: '/ws/live-class', cors: { origin: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [] } });
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const publisher = createClient({ url: redisUrl }); const subscriber = publisher.duplicate();
      await Promise.all([publisher.connect(), subscriber.connect()]);
      io.adapter(createAdapter(publisher, subscriber));
    }
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error('Authentication token is required'));
        const decoded = await getAuth().verifyIdToken(token);
        (socket as LiveSocket).user = { id: decoded.uid, role: String(decoded.role ?? '') };
        next();
      } catch { next(new Error('Invalid authentication token')); }
    });
    io.on('connection', (socket) => this.register(io, socket as LiveSocket));
    this.io = io;
    return io;
  }

  private register(io: Server, socket: LiveSocket): void {
    socket.on('join_session', (input: { sessionId: string; classId: string; teacherId?: string; displayName?: string }, acknowledge?: (value: unknown) => void) => {
      const user = socket.user!;
      let session = this.sessions.get(input.sessionId);
      if (!session) {
        if (user.role !== 'TEACHER' && user.role !== 'STAFF_TEACHER') return acknowledge?.({ error: 'Teacher must create the session first' });
        session = { sessionId: input.sessionId, classId: input.classId, teacherId: user.id, currentQuestionIndex: -1, sessionStatus: 'WAITING', connectedStudentsMap: {} };
        this.sessions.set(input.sessionId, session);
      }
      if (session.classId !== input.classId) return acknowledge?.({ error: 'Session class mismatch' });
      if (user.id !== session.teacherId) session.connectedStudentsMap[user.id] = { displayName: input.displayName, connectedAt: new Date().toISOString() };
      socket.join(session.sessionId);
      acknowledge?.({ session, leaderboard: this.quiz.leaderboard(session.sessionId) });
      io.to(session.sessionId).emit('session_presence', { connectedStudentCount: Object.keys(session.connectedStudentsMap).length });
    });

    socket.on('submit_answer', (input: Omit<AnswerSubmission, 'studentId'>, acknowledge?: (value: unknown) => void) => {
      const user = socket.user!; const session = this.sessions.get(input.sessionId);
      if (!session || session.sessionStatus !== 'QUESTION_ACTIVE' || input.questionIndex !== session.currentQuestionIndex) return acknowledge?.({ error: 'Question is not active' });
      const score = this.quiz.submitAnswer({ ...input, studentId: user.id });
      const leaderboard = this.quiz.leaderboard(input.sessionId);
      io.to(input.sessionId).emit('leaderboard_update', { leaderboard });
      acknowledge?.({ score, leaderboard });
    });

    socket.on('teacher_next_question', (input: { sessionId: string; quizId: string; questionIndex: number }, acknowledge?: (value: unknown) => void) => {
      const session = this.sessions.get(input.sessionId);
      if (!session || session.teacherId !== socket.user?.id) return acknowledge?.({ error: 'Only the session teacher can advance questions' });
      session.activeQuizId = input.quizId; session.currentQuestionIndex = input.questionIndex; session.sessionStatus = 'QUESTION_ACTIVE';
      io.to(input.sessionId).emit('question_started', { quizId: input.quizId, questionIndex: input.questionIndex }); acknowledge?.({ session });
    });

    socket.on('teacher_end_session', (input: { sessionId: string }, acknowledge?: (value: unknown) => void) => {
      const session = this.sessions.get(input.sessionId);
      if (!session || session.teacherId !== socket.user?.id) return acknowledge?.({ error: 'Only the session teacher can end the session' });
      session.sessionStatus = 'ENDED'; io.to(input.sessionId).emit('session_ended', { leaderboard: this.quiz.leaderboard(input.sessionId) }); this.quiz.clear(input.sessionId); acknowledge?.({ ok: true });
    });
    socket.on('disconnect', () => { for (const session of this.sessions.values()) { if (session.connectedStudentsMap[socket.user?.id ?? '']) delete session.connectedStudentsMap[socket.user!.id]; } });
  }
}

export function createLiveHttpServer(app: Parameters<typeof createServer>[0]): HttpServer { return createServer(app); }