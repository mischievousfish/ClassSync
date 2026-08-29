export interface WatermarkInsertionRequest {
  text: string;
  userId: string;
  timestamp: string;
  issuer?: string;
}

export interface WatermarkExtractionResult {
  userId: string;
  timestamp: string;
  issuer?: string;
  signal: string;
}

export class SteganographicWatermarker {
  private static readonly ZERO_WIDTH_CODES = ['\u200B', '\u200C', '\u200D'];

  static injectTextWatermark(input: WatermarkInsertionRequest): string {
    const payload = `${input.userId}|${input.timestamp}${input.issuer ? `|${input.issuer}` : ''}`;
    const marker = '\u200B\u200C\u200D';
    const encoded = payload
      .split('')
      .map((char, index) => `${char}${marker[(char.charCodeAt(0) + index) % marker.length]}`)
      .join('');

    return `${input.text}${marker}${encoded}`;
  }

  static extractTextWatermark(text: string): WatermarkExtractionResult | null {
    const marker = '\u200B\u200C\u200D';
    const markerIndex = text.lastIndexOf(marker);
    if (markerIndex === -1) return null;

    const hiddenPayload = text.slice(markerIndex + marker.length).replace(/[\u200B\u200C\u200D]/gu, '');
    if (!hiddenPayload) return null;

    const [userId, timestamp, issuer] = hiddenPayload.split('|');
    if (!userId || !timestamp) return null;

    return {
      userId,
      timestamp,
      issuer,
      signal: hiddenPayload,
    };
  }

  static embedImageWatermark(imageData: Uint8ClampedArray, userId: string, timestamp: string): Uint8ClampedArray {
    const payload = `${userId}\0${timestamp}`;
    const bytes = new Uint8ClampedArray(imageData);

    for (let index = 0; index < payload.length && index < bytes.length; index += 1) {
      const charCode = payload.charCodeAt(index);
      bytes[index] = charCode % 256;
    }

    return bytes;
  }

  static extractImageWatermark(imageData: Uint8ClampedArray): { userId: string; timestamp: string } | null {
    const payload: string[] = [];
    for (let index = 0; index < imageData.length; index += 1) {
      const value = imageData[index];
      if (value === 0) break;
      payload.push(String.fromCharCode(value));
    }

    const recovered = payload.join('');
    if (!recovered) return null;

    const separatorIndex = recovered.indexOf('\0');
    const userId = separatorIndex >= 0 ? recovered.slice(0, separatorIndex) : recovered;
    const timestamp = separatorIndex >= 0 ? recovered.slice(separatorIndex + 1) : '';

    if (!userId) return null;
    return { userId, timestamp };
  }
}
