import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  const statusCode = error instanceof AppError || error instanceof ZodError || error instanceof MulterError
    ? error instanceof AppError ? error.statusCode : 400
    : 500;
  const message = error instanceof ZodError
    ? error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    : error instanceof MulterError ? `Upload error: ${error.message}` : error instanceof AppError ? error.message : 'Internal server error';
  if (statusCode === 500) console.error(error);
  response.status(statusCode).json({ error: message });
}
