export interface BubbleCell {
  x: number;
  y: number;
  blackPixels: number;
  totalPixels: number;
}

export interface BubbleClassificationResult {
  status: 'FILLED' | 'EMPTY' | 'ERASED_MULTIPLE_MARKS';
  fillRatio: number;
  confidence: number;
}

export class BubbleDensityEvaluator {
  evaluate(cell: BubbleCell): BubbleClassificationResult {
    const fillRatio = cell.totalPixels === 0 ? 0 : cell.blackPixels / cell.totalPixels;

    if (fillRatio >= 0.55) {
      return {
        status: 'FILLED',
        fillRatio: Number(fillRatio.toFixed(4)),
        confidence: 0.99,
      };
    }

    if (fillRatio <= 0.1) {
      return {
        status: 'EMPTY',
        fillRatio: Number(fillRatio.toFixed(4)),
        confidence: 0.98,
      };
    }

    return {
      status: 'ERASED_MULTIPLE_MARKS',
      fillRatio: Number(fillRatio.toFixed(4)),
      confidence: 0.91,
    };
  }

  evaluateGrid(cells: BubbleCell[]): BubbleClassificationResult[] {
    return cells.map((cell) => this.evaluate(cell));
  }
}
