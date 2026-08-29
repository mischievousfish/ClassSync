import { MarketplaceController } from '../src/controllers/marketplace.controller';
import { DRMWatermarkEngine } from '../src/services/drm-watermark.engine';
import { RoyaltySplitService } from '../src/services/royalty-split.service';

describe('marketplace financial and DRM flow', () => {
  it('calculates the platform and seller split correctly', () => {
    const split = RoyaltySplitService.calculate({ grossAmountVnd: 200000, platformCommissionRate: 0.2, sellerShareRate: 0.8 });

    expect(split.platformFeeVnd).toBe(40000);
    expect(split.sellerPayoutVnd).toBe(160000);
  });

  it('builds a watermark payload for secure previews', () => {
    const engine = new DRMWatermarkEngine();
    const preview = engine.applyWatermark({
      content: 'Question 1\nQuestion 2\nQuestion 3\nQuestion 4',
      buyerIdentity: 'teacher-123',
      assetTitle: 'Algebra Sprint Pack',
    });

    expect(preview.watermarkedContent).toContain('teacher-123');
    expect(preview.watermarkText).toContain('Algebra Sprint Pack');
  });

  it('extracts a safe public preview and leaves encrypted payload for purchase', async () => {
    const controller = new MarketplaceController();
    const result = await controller.buildPreview({
      title: 'Geometry Mastery Pack',
      questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20'],
    });

    expect(result.publicPreview.length).toBeGreaterThan(0);
    expect(result.encryptedPayload).toContain('encrypted');
    expect(result.publicPreview).toContain('Q1');
  });
});
