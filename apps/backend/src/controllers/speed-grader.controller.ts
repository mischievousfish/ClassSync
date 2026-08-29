import { Request, Response } from 'express';

export interface SpeedGraderOverride {
  paperId: string;
  score: number;
  reason: string;
}

export interface AutoGradedPaper {
  paperId: string;
  autoScore: number;
  confidence: number;
  needsManualReview: boolean;
  notes: string[];
}

export class SpeedGraderController {
  evaluateFastTrack(items: AutoGradedPaper[]): AutoGradedPaper[] {
    return items.map((item) => ({
      ...item,
      needsManualReview: item.confidence < 0.8,
      notes: item.notes.length > 0 ? item.notes : ['Score auto-calculated; teacher review recommended if grading confidence is low.'],
    }));
  }

  overrideScore(request: Request, response: Response): void {
    const { paperId, score, reason } = request.body as SpeedGraderOverride;

    response.json({
      ok: true,
      paperId,
      overrideApplied: true,
      finalScore: score,
      reason,
      updatedAt: new Date().toISOString(),
    });
  }
}
