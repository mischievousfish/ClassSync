import { AudioProcessingPipeline, LectureTranscriptionService, SpokenDeadlineExtractor, VoiceCommandParser } from '../src/services/audio-processing';

describe('audio processing pipeline', () => {
  it('normalizes lecture transcripts into structured study assets', async () => {
    const service = new LectureTranscriptionService();
    const result = await service.processTranscript({
      transcript: 'Bài hôm nay về phương trình bậc hai. Công thức nghiệm: x = (-b ± √(b² - 4ac)) / 2a. Các em về nhà làm bài 5 trang 20, hạn nộp Thứ 5 tuần sau.',
      speakers: [
        { speakerLabel: 'Teacher', text: 'Bài hôm nay về phương trình bậc hai.' },
        { speakerLabel: 'Teacher', text: 'Công thức nghiệm: x = (-b ± √(b² - 4ac)) / 2a.' },
        { speakerLabel: 'Teacher', text: 'Các em về nhà làm bài 5 trang 20, hạn nộp Thứ 5 tuần sau.' },
      ],
    });

    expect(result.summary).toContain('phương trình bậc hai');
    expect(result.keyFormulas).toContain('x = (-b ± √(b² - 4ac)) / 2a');
    expect(result.deadlines[0].title).toContain('bài 5');
  });

  it('extracts spoken deadlines and normalizes them to structured tasks', () => {
    const extractor = new SpokenDeadlineExtractor();
    const result = extractor.extract('Các em về nhà làm bài 5 trang 20, hạn nộp Thứ 5 tuần sau');

    expect(result.task).toContain('bài 5');
    expect(result.deadlineLabel).toContain('Thứ 5');
    expect(result.confirmRequired).toBe(true);
  });

  it('parses voice commands into structured actions', () => {
    const parser = new VoiceCommandParser();
    const result = parser.parse('ClassSync ơi, lịch học hôm nay thế nào?');

    expect(result.action).toBe('VIEW_SCHEDULE');
    expect(result.intent).toBe('QUERY');
  });

  it('preprocesses audio by trimming silence and normalizing sample rate', async () => {
    const pipeline = new AudioProcessingPipeline();
    const result = await pipeline.process({
      audioBuffer: Buffer.from('fake-audio-data'),
      mimeType: 'audio/mpeg',
      sampleRate: 44100,
    });

    expect(result.preprocessed).toBeInstanceOf(Buffer);
    expect(result.sampleRate).toBe(16000);
    expect(result.noiseReduced).toBe(true);
  });
});
