import { NextFunction, Request, Response } from 'express';

export type GrowthFeatureFlag =
  | 'onboarding_headline_test'
  | 'referral_reward_threshold_v2'
  | 'class_join_deep_link'
  | 'pdf_watermark_export';

export class GrowthFeatureFlagService {
  private readonly flags = new Map<GrowthFeatureFlag, boolean>([
    ['onboarding_headline_test', true],
    ['referral_reward_threshold_v2', true],
    ['class_join_deep_link', true],
    ['pdf_watermark_export', true],
  ]);

  isEnabled(flag: GrowthFeatureFlag, userId?: string): boolean {
    if (!userId) return this.flags.get(flag) ?? false;
    const hash = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 100;
    if (flag === 'onboarding_headline_test') return hash < 50;
    return this.flags.get(flag) ?? false;
  }
}

export class GrowthFeatureFlagController {
  private readonly service = new GrowthFeatureFlagService();

  getFlag(request: Request, response: Response, next: NextFunction): void {
    try {
      const { flag, userId } = request.query as { flag?: GrowthFeatureFlag; userId?: string };
      if (!flag) {
        response.status(400).json({ error: 'flag is required' });
        return;
      }

      response.json({ flag, enabled: this.service.isEnabled(flag, userId) });
    } catch (error) {
      next(error);
    }
  }
}
