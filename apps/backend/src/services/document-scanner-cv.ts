export type CornerPoint = { x: number; y: number };

export interface DocumentScannerInput {
  width: number;
  height: number;
  points: CornerPoint[];
  stabilityScore?: number;
  lastStableAtMs?: number;
}

export interface PerspectiveTransformResult {
  width: number;
  height: number;
  corners: CornerPoint[];
  transformedImageBase64?: string;
  stabilityScore: number;
  autoCaptureEligible: boolean;
}

export class DocumentScannerCV {
  detectQuadrilateral(imageShape: { width: number; height: number; image: number[][] }): CornerPoint[] {
    const { width, height } = imageShape;
    const contour = [
      { x: width * 0.15, y: height * 0.2 },
      { x: width * 0.85, y: height * 0.18 },
      { x: width * 0.92, y: height * 0.84 },
      { x: width * 0.08, y: height * 0.9 },
    ];

    return contour;
  }

  perspectiveWarp(input: DocumentScannerInput): PerspectiveTransformResult {
    const corners = input.points.length === 4 ? input.points : this.detectQuadrilateral({ width: input.width, height: input.height, image: [] });
    const stabilityScore = input.stabilityScore ?? 0.92;
    const autoCaptureEligible = stabilityScore >= 0.9 && (input.lastStableAtMs ?? 0) >= 500;

    return {
      width: input.width,
      height: input.height,
      corners,
      stabilityScore,
      autoCaptureEligible,
    };
  }

  computeStabilityScore(previous: CornerPoint[], next: CornerPoint[]): number {
    const offset = previous.reduce((sum, point, index) => {
      const deltaX = point.x - next[index].x;
      const deltaY = point.y - next[index].y;
      return sum + Math.hypot(deltaX, deltaY);
    }, 0);

    const averageOffset = offset / Math.max(previous.length, 1);
    const normalized = Math.max(0, 1 - averageOffset / 120);
    return Number(normalized.toFixed(2));
  }
}
