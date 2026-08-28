import { getAuth } from 'firebase-admin/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors';
import { UserRole } from '../models';

export interface AuthenticatedRequest extends Request {
  user: { id: string; role?: UserRole };
}

export async function authenticate(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Bearer token is required');
    const decoded = await getAuth().verifyIdToken(header.slice(7));
    (request as AuthenticatedRequest).user = { id: decoded.uid, role: decoded.role as UserRole | undefined };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid authentication token'));
  }
}

export function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const user = (request as AuthenticatedRequest).user;
    if (user.role !== role) return next(new AppError(403, `${role} role is required`));
    next();
  };
}
