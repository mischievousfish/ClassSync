import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createAssignmentController,
  createClassController,
  joinClassController,
  studentScheduleController,
  updateStudentNotesController,
  generateLessonOutlineController,
  generateQuizController,
  parseAssignmentController,
} from '../controllers';
import { imageUpload } from '../middleware/upload';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { requireClassMembership } from '../middleware/class-membership';

export const apiRouter = Router();
apiRouter.use(authenticate);
apiRouter.post('/classes', requireRole('TEACHER'), createClassController);
apiRouter.post('/classes/join', requireRole('STUDENT'), joinClassController);
apiRouter.post('/assignments', requireRole('TEACHER'), createAssignmentController);
apiRouter.get('/student/schedule', requireRole('STUDENT'), (request, response, next) => {
  if (request.query.classId) return requireClassMembership(request, response, next);
  next();
}, studentScheduleController);
apiRouter.post('/teacher/students/:studentId/notes', requireRole('TEACHER'), updateStudentNotesController);
apiRouter.post('/ai/generate-quiz', requireRole('TEACHER'), aiRateLimiter, generateQuizController);
apiRouter.post('/ai/generate-lesson-outline', requireRole('TEACHER'), aiRateLimiter, generateLessonOutlineController);
apiRouter.post('/ocr/parse-assignment', requireRole('STUDENT'), imageUpload.single('image'), parseAssignmentController);
