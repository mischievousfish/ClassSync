import { Request, Response } from 'express';
import { AgenticTutorGraph } from '../services/agentic-tutor';

export class SSEChatController {
  constructor(private readonly graph = new AgenticTutorGraph()) {}

  handle(request: Request, response: Response): void {
    const payload = request.body ?? {};
    const message = typeof payload.message === 'string' ? payload.message : 'Can you help me understand this problem?';
    const classId = typeof payload.classId === 'string' ? payload.classId : 'default-class';
    const studentMastery = payload.studentMastery ?? { level: 'BEGINNER', weakTopics: [] };
    const result = this.graph.run({
      userId: String((request as any).user?.id ?? 'anonymous-student'),
      classId,
      message,
      studentMastery,
      problemContext: typeof payload.problemContext === 'string' ? payload.problemContext : message,
    });

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    const chunks = result.response.split(/(?<=[.!?])\s+/).filter(Boolean);
    chunks.forEach((chunk, index) => {
      const data = JSON.stringify({ type: 'chunk', index, text: chunk });
      response.write(`data: ${data}\n\n`);
    });

    response.write(`data: ${JSON.stringify({ type: 'done', intent: result.intent })}\n\n`);
    response.end();
  }
}

export const sseChatController = new SSEChatController();
