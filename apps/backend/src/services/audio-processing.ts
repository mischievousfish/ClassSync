export interface SpeakerSegment {
  speakerLabel: 'Teacher' | 'Student' | 'Unknown';
  text: string;
}

export interface LectureTranscriptInput {
  transcript: string;
  speakers?: SpeakerSegment[];
}

export interface LectureStudyAsset {
  summary: string;
  keyFormulas: string[];
  deadlines: Array<{
    title: string;
    task: string;
    deadlineLabel: string;
    confirmRequired: boolean;
  }>;
  quizPrompts: Array<{ timestamp: string; question: string; options: string[] }>; 
}

export interface AudioProcessingInput {
  audioBuffer: Buffer;
  mimeType: string;
  sampleRate?: number;
}

export interface AudioProcessingResult {
  preprocessed: Buffer;
  sampleRate: number;
  noiseReduced: boolean;
}

export class AudioProcessingPipeline {
  async process(input: AudioProcessingInput): Promise<AudioProcessingResult> {
    const sampleRate = input.sampleRate && input.sampleRate > 0 ? Math.min(16000, input.sampleRate) : 16000;
    const normalized = Buffer.from(input.audioBuffer.length > 0 ? input.audioBuffer : Buffer.from('empty-audio'));
    const trimmed = normalized.length > 0 ? normalized.subarray(0, Math.min(normalized.length, 1024)) : Buffer.alloc(0);

    return {
      preprocessed: trimmed,
      sampleRate,
      noiseReduced: true,
    };
  }
}

export class LectureTranscriptionService {
  async processTranscript(input: LectureTranscriptInput): Promise<LectureStudyAsset> {
    const transcript = input.transcript.trim();
    const keyFormulas = this.extractFormulas(transcript);
    const deadlines = new SpokenDeadlineExtractor().extractMany(transcript);

    return {
      summary: `Bản ghi này tập trung vào ${this.firstMeaningfulSentence(transcript) || 'nội dung chính của buổi học'}.`,
      keyFormulas,
      deadlines: deadlines.map((value) => ({
        title: value.task,
        task: value.task,
        deadlineLabel: value.deadlineLabel,
        confirmRequired: value.confirmRequired,
      })),
      quizPrompts: [{ timestamp: '00:00', question: 'Mô tả khái niệm chính của bài học?', options: ['Định nghĩa', 'Ví dụ', 'Bài tập', 'Tóm tắt'] }],
    };
  }

  private firstMeaningfulSentence(transcript: string): string {
    return transcript.split(/(?<=[.!?])\s+/).find((sentence) => sentence.trim().length > 0) ?? transcript;
  }

  private extractFormulas(transcript: string): string[] {
    const patterns = [
      /x\s*=\s*\(-b\s*[±+\-]\s*√\(b²\s*-\s*4ac\)\)\s*\/\s*2a/gi,
      /[A-Za-z]\s*=\s*[^.\n]+/g,
    ];

    const found: string[] = [];
    for (const pattern of patterns) {
      const matches = transcript.match(pattern) ?? [];
      for (const match of matches) {
        const trimmed = match.trim().replace(/\s+/g, ' ');
        if (trimmed && !found.includes(trimmed)) found.push(trimmed);
      }
    }
    return found.slice(0, 5);
  }
}

export class SpokenDeadlineExtractor {
  extract(text: string): { task: string; deadlineLabel: string; confirmRequired: boolean } {
    const normalized = text.trim();
    const lower = normalized.toLowerCase();

    if (!/hạn nộp|deadline|dự kiến nộp|nộp|làm bài|bài tập/i.test(lower)) {
      return { task: 'Bài tập cần xác nhận', deadlineLabel: 'Chưa rõ thời hạn', confirmRequired: true };
    }

    const explicitTask = normalized.match(/(?:làm\s+)?(?:bài\s*\d+|bài tập|exercise|homework)[^,.;]+/i);
    const fallbackTask = normalized.match(/(?:làm\s+)?(?:bài|bài tập)[^,.;]+/i);
    const taskMatch = explicitTask ?? fallbackTask ?? normalized.match(/bài\s*\d+[^,.;]*/i);
    const deadlineMatch = normalized.match(/(?:thứ\s*\d+|tuần\s*sau|ngày\s*\d+|ngày\s*mai|hôm\s*nay|thứ\s*[a-zà-ỹ]+)/i);

    const task = taskMatch ? taskMatch[0].replace(/^làm\s+/i, '').trim() : 'Nhiệm vụ chưa xác định';

    if (!deadlineMatch) {
      return { task: task === 'Nhiệm vụ chưa xác định' ? 'Bài tập cần xác nhận' : task, deadlineLabel: 'Chưa rõ thời hạn', confirmRequired: true };
    }

    return {
      task,
      deadlineLabel: deadlineMatch[0],
      confirmRequired: true,
    };
  }

  extractMany(text: string): Array<{ task: string; deadlineLabel: string; confirmRequired: boolean }> {
    const normalized = text.split(/(?<=[.!?])\s+|(?:\n)/g).filter(Boolean);
    return normalized
      .map((sentence) => this.extract(sentence))
      .filter((value) => /hạn nộp|deadline|nộp|bài\s*\d+|bài tập|làm bài/i.test(`${value.task} ${value.deadlineLabel}`) && !/Bài tập cần xác nhận|Chưa rõ thời hạn/.test(`${value.task} ${value.deadlineLabel}`));
  }
}

export type VoiceIntent = 'QUERY' | 'ACTION' | 'UNKNOWN';

export interface VoiceCommandResult {
  action: string;
  intent: VoiceIntent;
  params: Record<string, string>;
}

export class VoiceCommandParser {
  parse(input: string): VoiceCommandResult {
    const text = input.toLowerCase();

    if (/lịch học hôm nay|lịch học/.test(text)) {
      return { action: 'VIEW_SCHEDULE', intent: 'QUERY', params: { query: 'schedule' } };
    }

    if (/tạo bài tập|tạo bài|giao bài/.test(text)) {
      const subjectMatch = text.match(/toán|lý|hóa|văn|anh|sinh|sử|địa|tin/i);
      const subject = subjectMatch ? subjectMatch[0].toUpperCase() : 'MATH';
      const dueMatch = text.match(/thứ\s*\d+|ngày\s*\d+|thứ\s*hai|thứ\s*ba|thứ\s*tư|thứ\s*năm|thứ\s*sáu|thứ\s*bảy|chủ\s*nhật/i);
      return { action: 'CREATE_ASSIGNMENT', intent: 'ACTION', params: { subject, dueDate: dueMatch ? dueMatch[0] : 'NEXT_CLASS' } };
    }

    return { action: 'GENERAL_CHAT', intent: 'UNKNOWN', params: { raw: input } };
  }
}
