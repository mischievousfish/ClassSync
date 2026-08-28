import { z } from 'zod';

export const scheduleInfoSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  timezone: z.string().optional(),
  location: z.string().optional(),
});

export const createClassSchema = z.object({
  className: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(80),
  scheduleInfo: z.array(scheduleInfoSchema).default([]),
});

export const joinClassSchema = z.object({ classCode: z.string().trim().length(6).toUpperCase() });

export const createAssignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).optional(),
  dueDate: z.coerce.date(),
  attachments: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
    contentType: z.string().optional(),
  })).default([]),
});

export const studentNotesSchema = z.object({
  classId: z.string().min(1),
  teacherNotes: z.string().max(5000),
});

export const quizGenerationSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  gradeLevel: z.string().trim().min(1).max(80),
  numQuestions: z.coerce.number().int().min(1).max(50).default(10),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
});

export const lessonOutlineSchema = z.object({
  topic: z.string().trim().min(1).max(500).optional(),
  documentText: z.string().trim().max(30000).optional(),
}).refine((value) => Boolean(value.topic || value.documentText), { message: 'topic or documentText is required' });
