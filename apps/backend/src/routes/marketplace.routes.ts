import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { authenticate, requireRole } from '../middleware/auth';

export const marketplaceRouter = Router();
const controller = new MarketplaceController();

marketplaceRouter.use(authenticate);
marketplaceRouter.post('/products/preview', requireRole('TEACHER'), controller.getProductPreview.bind(controller));
marketplaceRouter.post('/payouts', requireRole('TEACHER'), controller.calculatePayout.bind(controller));
marketplaceRouter.post('/payouts/batch', requireRole('TEACHER'), controller.payoutBatch.bind(controller));
