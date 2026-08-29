import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';
import { AnalyticsAggregatorService } from '../services/analytics-aggregator.service';
import { MicroProfileAIGenerator } from '../services/micro-profile-ai.generator';
import { StudentRecommendationService } from '../services/student-recommendation.service';
import { AppError } from '../shared/errors';

const aggregator = new AnalyticsAggregatorService();
const profiler = new MicroProfileAIGenerator(aggregator);
const recommendations = new StudentRecommendationService(aggregator);

export async function analyticsEngineController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const tenant = request as TenantRequest;
    if (request.query.classId) response.json(await aggregator.getClassIntelligence(String(request.query.classId), tenant.tenant.orgId));
    else if (request.query.studentId) response.json(await aggregator.getStudentPerformanceMatrix(String(request.query.studentId), 30, tenant.tenant.orgId));
    else throw new AppError(400, 'classId or studentId is required');
  } catch (error) { next(error); }
}

export async function generateMicroProfileController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { const tenant = request as TenantRequest; response.status(201).json(await profiler.generate(String(request.params.studentId), { orgId: tenant.tenant.orgId, teacherId: tenant.user.id })); } catch (error) { next(error); }
}

export async function reviewMicroProfileController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { await profiler.review(String(request.params.noteId), request.body, (request as TenantRequest).tenant.orgId); response.status(204).send(); } catch (error) { next(error); }
}

export async function studentRecommendationsController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await recommendations.getRecommendations((request as AuthenticatedRequest).user.id)); } catch (error) { next(error); }
}

export async function classReportExportController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { const csv = await aggregator.exportClassReport(String(request.params.classId), (request as TenantRequest).tenant.orgId); response.type('text/csv').attachment(`class-${request.params.classId}-analytics.csv`).send(csv); } catch (error) { next(error); }
}