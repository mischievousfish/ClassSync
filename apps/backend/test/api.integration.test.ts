import request = require('supertest');
import { AppError } from '../src/shared/errors';

const verifyIdToken = jest.fn(async (token: string) => ({
  uid: token.startsWith('teacher') ? 'teacher-1' : 'student-1',
  role: token.startsWith('teacher') ? 'TEACHER' : 'STUDENT',
}));
const generateQuiz = jest.fn(async () => ({ assetId: 'asset-1', type: 'QUIZ', content: { title: 'Algebra', questions: [] }, model: 'test', createdAt: new Date().toISOString() }));

jest.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken }) }));
jest.mock('../src/config/firebase', () => ({ db: { collection: jest.fn(() => ({})) }, messaging: {} }));
jest.mock('../src/services/assignment.service', () => ({
  createAssignment: jest.fn(async (_teacherId: string, input: Record<string, unknown>) => ({ id: 'assignment-1', ...input })),
  getStudentSchedule: jest.fn(async () => []),
}));
jest.mock('../src/services/ai.service', () => ({
  generateQuiz,
  generateLessonOutline: jest.fn(async () => ({ assetId: 'asset-2', type: 'LESSON_OUTLINE', content: {}, model: 'test', createdAt: new Date().toISOString() })),
  parseAssignmentText: jest.fn(async () => ({ subject: 'Math', assignmentTitle: 'Exercises', extractedDescription: 'Practice', detectedDueDate: null, actionItems: [] })),
}));
jest.mock('../src/services/ocr.service', () => ({ extractTextFromImage: jest.fn(async () => 'Math exercises due Friday') }));

import { app } from '../src/app';

describe('protected API contracts', () => {
  it('allows a mock teacher token in development mode for demo flows', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_MOCK_AUTH = 'true';

    const response = await request(app)
      .post('/api/v1/ai/generate-quiz')
      .set('Authorization', 'Bearer mock-teacher-token')
      .send({ topic: 'Algebra', gradeLevel: '10' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ assetId: 'asset-1' });
    delete process.env.ALLOW_MOCK_AUTH;
  });

  it('rejects a student from teacher AI endpoints', async () => {
    const response = await request(app)
      .post('/api/v1/ai/generate-quiz')
      .set('Authorization', 'Bearer student-token')
      .send({ topic: 'Algebra', gradeLevel: '10' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('TEACHER');
  });

  it('rejects a student from teacher micro-profile endpoints', async () => {
    const response = await request(app)
      .post('/api/v1/teacher/students/student-2/notes')
      .set('Authorization', 'Bearer student-token')
      .send({ classId: 'class-1', teacherNotes: 'Private note' });

    expect(response.status).toBe(403);
  });

  it('allows a teacher to create an assignment through the versioned route', async () => {
    const response = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', 'Bearer teacher-token')
      .send({ classId: 'class-1', title: 'Quadratic equations', dueDate: '2030-01-01T10:00:00Z' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 'assignment-1', classId: 'class-1', title: 'Quadratic equations' });
  });

  it('parses a base64 OCR payload and returns an editable result', async () => {
    const image = `data:image/png;base64,${Buffer.from('fake-image').toString('base64')}`;
    const response = await request(app)
      .post('/api/v1/ocr/parse-assignment')
      .set('Authorization', 'Bearer student-token')
      .send({ imageBase64: image });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ subject: 'Math', assignmentTitle: 'Exercises', extractedText: 'Math exercises due Friday' });
  });

  it('maps malformed Gemini output to a provider error', async () => {
    generateQuiz.mockRejectedValueOnce(new AppError(502, 'Gemini returned invalid JSON'));
    const response = await request(app)
      .post('/api/v1/ai/generate-quiz')
      .set('Authorization', 'Bearer teacher-token')
      .send({ topic: 'Algebra', gradeLevel: '10' });

    expect(response.status).toBe(502);
  });

  it('preserves an AI provider rate-limit response', async () => {
    generateQuiz.mockRejectedValueOnce(new AppError(429, 'AI rate limit exceeded'));
    const response = await request(app)
      .post('/api/v1/ai/generate-quiz')
      .set('Authorization', 'Bearer teacher-token')
      .send({ topic: 'Algebra', gradeLevel: '10' });

    expect(response.status).toBe(429);
  });
});