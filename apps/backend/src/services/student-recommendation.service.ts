import { generateStructuredJson } from './ai.service';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';

export interface RecommendationQuiz {
  title: string;
  questions: Array<{ question: string; options: string[]; correctOptionIndex: number; explanation: string; topic: string }>;
}

const quizSchema = { type: 'object', properties: { title: { type: 'string' }, questions: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, correctOptionIndex: { type: 'integer' }, explanation: { type: 'string' }, topic: { type: 'string' } }, required: ['question', 'options', 'correctOptionIndex', 'explanation', 'topic'] } } }, required: ['title', 'questions'] };

export class StudentRecommendationService {
  constructor(private readonly aggregator = new AnalyticsAggregatorService()) {}

  async getRecommendations(studentId: string, orgId?: string) {
    const matrix = await this.aggregator.getStudentPerformanceMatrix(studentId, 30, orgId);
    const weakSpots = [...matrix.topics].sort((left, right) => left.mastery - right.mastery).slice(0, 3);
    if (!weakSpots.length) return { studentId, weakSpots: [], quiz: null };
    const quiz = await generateStructuredJson<RecommendationQuiz>(`Create exactly 5 adaptive practice questions for a student. Target these weak topics: ${JSON.stringify(weakSpots)}. Questions should bridge foundational gaps, use 2-4 options, zero-based correctOptionIndex, and return only the supplied JSON schema.`, quizSchema);
    if (quiz.questions.length !== 5) throw new Error('Recommendation quiz must contain exactly 5 questions');
    return { studentId, weakSpots, quiz };
  }
}