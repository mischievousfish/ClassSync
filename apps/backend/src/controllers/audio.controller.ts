import { Request, Response, NextFunction } from 'express';
import { AudioProcessingPipeline, LectureTranscriptionService, SpokenDeadlineExtractor } from '../services/audio-processing';

export async function transcribeLectureController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const transcript = typeof request.body?.transcript === 'string' ? request.body.transcript : 'Bài học hôm nay về các khái niệm chính.';
    const speakers = Array.isArray(request.body?.speakers) ? request.body.speakers : [];
    const pipeline = new AudioProcessingPipeline();
    const processed = await pipeline.process({
      audioBuffer: Buffer.from(String(request.body?.audioBase64 ?? '')), 
      mimeType: typeof request.body?.mimeType === 'string' ? request.body.mimeType : 'audio/mpeg',
      sampleRate: Number(request.body?.sampleRate ?? 44100),
    });
    const service = new LectureTranscriptionService();
    const studyKit = await service.processTranscript({ transcript, speakers });
    const spokenDeadlines = new SpokenDeadlineExtractor().extractMany(transcript);

    response.json({ processed, studyKit, spokenDeadlines });
  } catch (error) {
    next(error);
  }
}
