import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateLessonOutline, generateQuiz } from '../services/ai.service';
import { lessonOutlineSchema, quizGenerationSchema } from '../shared/validation';

export async function generateQuizController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const input = quizGenerationSchema.parse(request.body);
    const result = await generateQuiz((request as AuthenticatedRequest).user.id, input);
    response.status(201).json(result);
  } catch (error) { next(error); }
}

export async function generateLessonOutlineController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const input = lessonOutlineSchema.parse(request.body);
    const result = await generateLessonOutline((request as AuthenticatedRequest).user.id, input);
    response.status(201).json(result);
  } catch (error) { next(error); }
}
