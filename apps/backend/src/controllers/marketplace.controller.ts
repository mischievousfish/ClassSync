import { NextFunction, Request, Response } from 'express';
import { DRMWatermarkEngine } from '../services/drm-watermark.engine';
import { RoyaltySplitService } from '../services/royalty-split.service';

export class MarketplaceController {
  private readonly drm = new DRMWatermarkEngine();

  buildPreview(input: { title: string; questions: string[]; previewPercent?: number }): Promise<{ publicPreview: string; encryptedPayload: string }> {
    return Promise.resolve(this.drm.extractSafePreview(input));
  }

  async getProductPreview(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const { title, questions, previewPercent } = request.body as { title: string; questions: string[]; previewPercent?: number };
      response.json(await this.buildPreview({ title, questions, previewPercent }));
    } catch (error) {
      next(error);
    }
  }

  async calculatePayout(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const { grossAmountVnd } = request.body as { grossAmountVnd: number };
      const split = RoyaltySplitService.calculate({ grossAmountVnd });
      response.json(split);
    } catch (error) {
      next(error);
    }
  }

  async payoutBatch(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const { payouts } = request.body as { payouts: Array<{ userId: string; sellerPayoutVnd: number; kycStatus: 'VERIFIED' | 'PENDING'; taxWithheldVnd?: number }> };
      response.json({ payouts: RoyaltySplitService.monthlyBatchPayouts(payouts ?? []) });
    } catch (error) {
      next(error);
    }
  }
}
