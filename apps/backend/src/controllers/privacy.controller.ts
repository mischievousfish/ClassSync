import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { eraseUserAccount, exportUserData, recordConsent } from '../services/privacy.service';

export async function consentController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await recordConsent((request as AuthenticatedRequest).user.id, { ...request.body, ipAddress: request.ip })); } catch (error) { next(error); }
}

export async function deleteAccountController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { await eraseUserAccount((request as AuthenticatedRequest).user.id); response.status(202).json({ status: 'ERASURE_QUEUED', targetCompletionDays: 7 }); } catch (error) { next(error); }
}

export async function exportDataController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { const archive = await exportUserData((request as AuthenticatedRequest).user.id); response.type('application/zip').attachment('classsync-personal-data.zip').send(archive); } catch (error) { next(error); }
}