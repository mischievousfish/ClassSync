export type AiAssetType = 'QUIZ' | 'LESSON_OUTLINE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface GeneratedLessonOutline {
  title: string;
  objectives: string[];
  keyConcepts: string[];
  breakdown: string[];
  summary: string;
}

export interface QuizRequest {
  topic: string;
  gradeLevel: string;
  numQuestions: number;
  difficulty: Difficulty;
}

export interface LessonOutlineRequest {
  topic?: string;
  documentText?: string;
}

export interface AiAssetResponse<T> {
  assetId: string;
  type: AiAssetType;
  content: T;
  model: string;
  createdAt: string;
}

export interface ParsedAssignment {
  subject: string;
  assignmentTitle: string;
  extractedDescription: string;
  detectedDueDate: string | null;
  actionItems: string[];
}
