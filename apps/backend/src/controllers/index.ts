import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { createClassSchema, createAssignmentSchema, joinClassSchema, studentNotesSchema } from '../shared/validation';
import { createClass, joinClass, getStudentClasses } from '../services/class.service';
import { createAssignment, getStudentSchedule } from '../services/assignment.service';
import { updateStudentNotes } from '../services/profile.service';
export { generateLessonOutlineController, generateQuizController } from './ai.controller';
export { parseAssignmentController } from './ocr.controller';

export async function createClassController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await createClass((request as AuthenticatedRequest).user.id, createClassSchema.parse(request.body))); } catch (error) { next(error); }
}
export async function joinClassController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await joinClass((request as AuthenticatedRequest).user.id, joinClassSchema.parse(request.body).classCode)); } catch (error) { next(error); }
}
export async function createAssignmentController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await createAssignment((request as AuthenticatedRequest).user.id, createAssignmentSchema.parse(request.body))); } catch (error) { next(error); }
}
export async function studentScheduleController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = (request as AuthenticatedRequest).user.id;
    const [classes, deadlines] = await Promise.all([getStudentClasses(studentId), getStudentSchedule(studentId)]);
    response.json({ classes, deadlines });
  } catch (error) { next(error); }
}
export async function updateStudentNotesController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const { classId, teacherNotes } = studentNotesSchema.parse(request.body);
    const studentId = String(request.params.studentId);
    response.json(await updateStudentNotes((request as AuthenticatedRequest).user.id, studentId, classId, teacherNotes));
  } catch (error) { next(error); }
}
