import { NextFunction, Request, Response } from 'express';
import { ImageEnhancementPipeline } from '../services/image-enhancement-pipeline';
import { DocumentScannerCV } from '../services/document-scanner-cv';

export async function enhanceDocumentController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const { width = 1200, height = 1600, pixels = [], mode = 'bw-document' } = request.body as {
      width?: number;
      height?: number;
      pixels?: number[];
      mode?: 'original' | 'magic-color' | 'bw-document';
    };

    const pipeline = new ImageEnhancementPipeline();
    const scanner = new DocumentScannerCV();
    const enhancement = pipeline.enhance({ width, height, pixels, mode });
    const transform = scanner.perspectiveWarp({
      width,
      height,
      points: [
        { x: 0.15 * width, y: 0.2 * height },
        { x: 0.85 * width, y: 0.18 * height },
        { x: 0.92 * width, y: 0.84 * height },
        { x: 0.08 * width, y: 0.9 * height },
      ],
      stabilityScore: 0.95,
      lastStableAtMs: 600,
    });

    response.json({
      enhancement,
      transform,
      message: 'Document enhancement and perspective stabilization completed.',
    });
  } catch (error) {
    next(error);
  }
}
