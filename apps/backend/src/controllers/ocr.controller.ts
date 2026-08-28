import { NextFunction, Request, Response } from 'express';
import { parseAssignmentText } from '../services/ai.service';
import { extractTextFromImage } from '../services/ocr.service';
import { getSingleFileBase64 } from '../shared/request';
import { AppError } from '../shared/errors';

export async function parseAssignmentController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const uploaded = request.file ? { data: request.file.buffer, mimeType: request.file.mimetype } : getSingleFileBase64(request);
    if (!uploaded) throw new AppError(400, 'Provide an image file or imageBase64 data URL');
    const rawText = await extractTextFromImage(uploaded.data, uploaded.mimeType);
    const parsed = await parseAssignmentText(rawText);
    response.json({ ...parsed, extractedText: rawText });
  } catch (error) { next(error); }
}
