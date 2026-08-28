import { AppError } from '../shared/errors';

const maxBytes = Number(process.env.OCR_MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024;

export async function extractTextFromImage(image: Buffer, mimeType: string): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) throw new AppError(400, 'Only JPEG, PNG, and WebP images are supported');
  if (image.length > maxBytes) throw new AppError(413, 'Image exceeds the configured size limit');
  const apiKey = process.env.CLOUD_VISION_KEY;
  if (!apiKey) throw new AppError(503, 'Cloud Vision is not configured');

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ requests: [{ image: { content: image.toString('base64') }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] }),
  });
  if (!response.ok) throw new AppError(502, 'Cloud Vision request failed');
  const payload = await response.json() as { responses?: Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }> };
  const result = payload.responses?.[0];
  if (result?.error) throw new AppError(502, result.error.message ?? 'Cloud Vision could not process the image');
  const text = result?.fullTextAnnotation?.text?.trim();
  if (!text) throw new AppError(422, 'No readable text was found in the image');
  return text;
}
