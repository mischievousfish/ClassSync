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
    const isDevMockAuthEnabled = process.env.NODE_ENV === 'development' && process.env.ALLOW_MOCK_AUTH === 'true';
    const mockUsers: Record<string, AuthenticatedRequest['user']> = {
      'mock-student-token': { id: 'student-demo', role: 'STUDENT' },
      'mock-teacher-token': { id: 'teacher-demo', role: 'TEACHER' },
    };

    if (!header?.startsWith('Bearer ')) {
      if (isDevMockAuthEnabled) {
        (request as AuthenticatedRequest).user = mockUsers['mock-student-token'];
        return next();
      }
      throw new AppError(401, 'Bearer token is required');
    }

    const token = header.slice(7);
    if (isDevMockAuthEnabled && mockUsers[token]) {
      (request as AuthenticatedRequest).user = mockUsers[token];
      return next();
    }

    const decoded = await getAuth().verifyIdToken(token);
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
