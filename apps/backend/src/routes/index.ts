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
import { organizationRouter } from './organization.routes';
import { paymentReceivedController, generateMonthlyBillingController, generateVietQrController, parentDashboardController } from '../controllers/tuition-billing.controller';
import { resolveTenant, requireOrgRole } from '../middleware/tenant';
import { analyticsEngineController, classReportExportController, generateMicroProfileController, reviewMicroProfileController, studentRecommendationsController } from '../controllers/learning-analytics.controller';
import { consentController, deleteAccountController, exportDataController } from '../controllers/privacy.controller';
import { claimQuestController, getGamificationProfileController, processGamificationActionController, purchaseStreakFreezeController } from '../controllers/gamification.controller';
import { dynamicAttendanceQrController, verifyAttendanceController } from '../controllers/attendance.controller';

export const apiRouter = Router();
apiRouter.post('/billing/webhook/payment-received', paymentReceivedController);
apiRouter.use(authenticate);
apiRouter.use('/orgs', organizationRouter);
apiRouter.post('/billing/generate-monthly', resolveTenant, requireOrgRole('ORG_ADMIN'), generateMonthlyBillingController);
apiRouter.post('/billing/:billId/vietqr', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER'), generateVietQrController);
apiRouter.get('/parent/dashboard/:studentId', parentDashboardController);
apiRouter.get('/student/recommendations', requireRole('STUDENT'), studentRecommendationsController);
apiRouter.post('/privacy/consent', consentController);
apiRouter.post('/privacy/delete-account', deleteAccountController);
apiRouter.get('/privacy/export-data', exportDataController);
apiRouter.get('/gamification/profile', requireRole('STUDENT'), getGamificationProfileController);
apiRouter.post('/gamification/streak', requireRole('STUDENT'), processGamificationActionController);
apiRouter.post('/gamification/streak-freeze/purchase', requireRole('STUDENT'), purchaseStreakFreezeController);
apiRouter.post('/gamification/quests/:questId/claim', requireRole('STUDENT'), claimQuestController);
apiRouter.post('/attendance/qr', requireRole('TEACHER'), dynamicAttendanceQrController);
apiRouter.post('/attendance/verify', requireRole('STUDENT'), verifyAttendanceController);
apiRouter.get('/analytics/engine', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF_TEACHER'), analyticsEngineController);
apiRouter.get('/analytics/classes/:classId/export', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF_TEACHER'), classReportExportController);
apiRouter.post('/analytics/micro-profile/:studentId', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF_TEACHER'), generateMicroProfileController);
apiRouter.patch('/analytics/micro-profile/notes/:noteId', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF_TEACHER'), reviewMicroProfileController);
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
