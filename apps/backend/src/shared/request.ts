import { Request } from 'express';

export function getSingleFileBase64(request: Request): { data: Buffer; mimeType: string } | null {
  const imageBase64 = typeof request.body?.imageBase64 === 'string' ? request.body.imageBase64 : null;
  if (!imageBase64) return null;
  const match = imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return { data: Buffer.from(match[2], 'base64'), mimeType: match[1] };
}
