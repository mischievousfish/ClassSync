import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/firebase';
import { GamificationService } from '../services/gamification.service';

const service = new GamificationService();

export async function processGamificationActionController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await service.processAction((request as AuthenticatedRequest).user.id, request.body)); } catch (error) { next(error); }
}

export async function getGamificationProfileController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (request as AuthenticatedRequest).user.id;
    const [profile, quests] = await Promise.all([db.collection('student_gamification_profiles').doc(userId).get(), db.collection('quests_daily').where('userId', '==', userId).where('status', 'in', ['IN_PROGRESS', 'COMPLETED']).get()]);
    response.json({ profile: profile.exists ? profile.data() : null, quests: quests.docs.map((document) => document.data()) });
  } catch (error) { next(error); }
}

export async function purchaseStreakFreezeController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await service.purchaseStreakFreeze((request as AuthenticatedRequest).user.id, Number(request.body.cost ?? 100))); } catch (error) { next(error); }
}

export async function claimQuestController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await service.claimQuest((request as AuthenticatedRequest).user.id, String(request.params.questId))); } catch (error) { next(error); }
}