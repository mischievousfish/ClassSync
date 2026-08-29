export interface WatermarkRequest {
  content: string;
  buyerIdentity: string;
  assetTitle: string;
  previewPercent?: number;
}

export interface WatermarkResult {
  watermarkedContent: string;
  watermarkText: string;
  previewPercent: number;
  encryptedPayload: string;
}

export class DRMWatermarkEngine {
  applyWatermark(input: WatermarkRequest): WatermarkResult {
    const previewPercent = input.previewPercent ?? 20;
    const watermarkText = `[ClassSync Secure Preview] ${input.assetTitle} | Buyer: ${input.buyerIdentity} | For educational use only.`;
    const watermarkedContent = `${watermarkText}\n\n${input.content}`;
    const encryptedPayload = `encrypted:${Buffer.from(JSON.stringify({
      title: input.assetTitle,
      buyerIdentity: input.buyerIdentity,
      previewPercent,
      payload: input.content,
    })).toString('base64')}`;

    return {
      watermarkedContent,
      watermarkText,
      previewPercent,
      encryptedPayload,
    };
  }

  extractSafePreview(input: { title: string; questions: string[]; previewPercent?: number }): { publicPreview: string; encryptedPayload: string } {
    const previewPercent = input.previewPercent ?? 20;
    const totalQuestions = input.questions.length;
    const safeCount = Math.max(1, Math.ceil((totalQuestions * previewPercent) / 100));
    const previewQuestions = input.questions.slice(0, safeCount);
    const publicPreview = previewQuestions.join('\n');
    const encryptedPayload = `encrypted:${Buffer.from(JSON.stringify({
      title: input.title,
      questionCount: totalQuestions,
      publicPreview,
      isFullAsset: true,
    })).toString('base64')}`;

    return { publicPreview, encryptedPayload };
  }
}
