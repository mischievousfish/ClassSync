export interface EnhanceImageInput {
  width: number;
  height: number;
  pixels: number[];
  mode?: 'original' | 'magic-color' | 'bw-document';
}

export interface EnhanceImageOutput {
  enhancedPixels: number[];
  mode: 'original' | 'magic-color' | 'bw-document';
  contrastBoost: number;
  shadowRemoved: boolean;
}

export class SauvolaThresholding {
  apply(pixels: number[], width: number, height: number, windowSize = 25, k = 0.2): number[] {
    const output: number[] = [];
    const size = width * height;

    for (let idx = 0; idx < size; idx += 1) {
      const x = idx % width;
      const y = Math.floor(idx / width);
      let sum = 0;
      let count = 0;
      let variance = 0;

      for (let wy = -windowSize; wy <= windowSize; wy += 1) {
        for (let wx = -windowSize; wx <= windowSize; wx += 1) {
          const nx = x + wx;
          const ny = y + wy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const pixelIndex = ny * width + nx;
          const value = pixels[pixelIndex] ?? 0;
          sum += value;
          count += 1;
        }
      }

      const mean = count ? sum / count : 0;
      for (let wy = -windowSize; wy <= windowSize; wy += 1) {
        for (let wx = -windowSize; wx <= windowSize; wx += 1) {
          const nx = x + wx;
          const ny = y + wy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const pixelIndex = ny * width + nx;
          const value = pixels[pixelIndex] ?? 0;
          variance += (value - mean) ** 2;
        }
      }

      const stdDev = count ? Math.sqrt(variance / count) : 0;
      const threshold = mean * (1 + k * ((stdDev / 128) - 1));
      output[idx] = pixels[idx] > threshold ? 255 : 0;
    }

    return output;
  }
}

export class ImageEnhancementPipeline {
  private readonly thresholding = new SauvolaThresholding();

  enhance(input: EnhanceImageInput): EnhanceImageOutput {
    const { width, height, pixels, mode = 'original' } = input;
    const shadowRemoved = mode !== 'original';
    const enhancedPixels = pixels.map((pixel, index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      const normalized = Math.min(255, Math.max(0, pixel));
      const vignette = Math.max(0.7, 1 - (((x / width) * 0.2) + ((y / height) * 0.2)));
      const adjusted = mode === 'bw-document' ? (normalized > 180 ? 255 : 0) : Math.min(255, Math.round(normalized * vignette * 1.2));
      return adjusted;
    });

    const localThresholded = mode === 'bw-document' ? this.thresholding.apply(enhancedPixels, width, height) : enhancedPixels;
    const contrastBoost = mode === 'magic-color' ? 1.35 : mode === 'bw-document' ? 1.7 : 1.0;

    return {
      enhancedPixels: localThresholded,
      mode,
      contrastBoost,
      shadowRemoved,
    };
  }
}
