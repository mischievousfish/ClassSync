import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AttendanceVerificationService } from '../services/attendance-verification.service';

const service = new AttendanceVerificationService();

export async function dynamicAttendanceQrController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await service.createDynamicQr(String(request.body.sessionId), String(request.body.classId))); } catch (error) { next(error); }
}

export async function verifyAttendanceController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await service.verify({ ...request.body, studentId: (request as AuthenticatedRequest).user.id }, (request as AuthenticatedRequest).user.id)); } catch (error) { next(error); }
}