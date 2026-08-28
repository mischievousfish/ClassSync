import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest } from './auth';
import { AppError } from '../shared/errors';

export async function requireClassMembership(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const classId = String(request.params.classId ?? request.query.classId ?? '');
    const studentId = (request as AuthenticatedRequest).user.id;
    if (!classId) throw new AppError(400, 'classId is required');
    const enrollment = await db.collection('classEnrollments').doc(`${classId}_${studentId}`).get();
    if (!enrollment.exists || (enrollment.data()?.status && enrollment.data()?.status !== 'ACTIVE')) {
      throw new AppError(403, 'Active class enrollment is required');
    }
    next();
  } catch (error) { next(error); }
}