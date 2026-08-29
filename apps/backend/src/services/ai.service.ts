import { GoogleGenAI } from '@google/genai';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AiAssetResponse, GeneratedLessonOutline, GeneratedQuiz, LessonOutlineRequest, ParsedAssignment, QuizRequest } from '../models/ai';
import { AppError } from '../shared/errors';
import { sanitizePromptParts } from '../shared/piiSanitizer';

const aiAssets = db.collection('ai_generated_assets');
const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

const quizSchema = {
  type: 'object', properties: {
    title: { type: 'string' },
    questions: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, questionText: { type: 'string' }, options: { type: 'array', items: { type: 'string' } },
      correctOptionIndex: { type: 'integer' }, explanation: { type: 'string' },
    }, required: ['id', 'questionText', 'options', 'correctOptionIndex', 'explanation'] } },
  }, required: ['title', 'questions'],
};

const lessonSchema = {
  type: 'object', properties: {
    title: { type: 'string' }, objectives: { type: 'array', items: { type: 'string' } },
    keyConcepts: { type: 'array', items: { type: 'string' } }, breakdown: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' },
  }, required: ['title', 'objectives', 'keyConcepts', 'breakdown', 'summary'],
};

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError(503, 'Gemini API is not configured');
  return new GoogleGenAI({ apiKey });
}

function parseJson<T>(text: string): T {
  try { return JSON.parse(text) as T; } catch { throw new AppError(502, 'Gemini returned invalid JSON'); }
}

export async function generateStructuredJson<T>(prompt: string, responseSchema: object): Promise<T> {
  const response = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema },
  });
  if (!response.text) throw new AppError(502, 'Gemini returned an empty response');
  return parseJson<T>(response.text);
}

export async function generateQuiz(teacherId: string, input: QuizRequest): Promise<AiAssetResponse<GeneratedQuiz>> {
  const safe = sanitizePromptParts({ topic: input.topic, gradeLevel: input.gradeLevel });
  const content = await generateStructuredJson<GeneratedQuiz>(`Generate exactly ${input.numQuestions} educational quiz questions for topic "${safe.topic}" at grade level "${safe.gradeLevel}". Difficulty: ${input.difficulty}. Use clear language. Every question must have 2-5 options and correctOptionIndex must be zero-based. Return only JSON matching the supplied schema.`, quizSchema);
  if (content.questions.length !== input.numQuestions) throw new AppError(502, 'Gemini returned an unexpected question count');
  const reference = aiAssets.doc();
  const createdAt = Timestamp.now();
  await reference.set({ id: reference.id, teacherId, type: 'QUIZ', promptInput: input, generatedContent: content, model, createdAt });
  return { assetId: reference.id, type: 'QUIZ', content, model, createdAt: createdAt.toDate().toISOString() };
}

export async function generateLessonOutline(teacherId: string, input: LessonOutlineRequest): Promise<AiAssetResponse<GeneratedLessonOutline>> {
  const safe = sanitizePromptParts({ topic: input.topic, documentText: input.documentText });
  const source = [safe.topic ? `Topic: ${safe.topic}` : '', safe.documentText ? `Source document:\n${safe.documentText}` : ''].filter(Boolean).join('\n');
  const content = await generateStructuredJson<GeneratedLessonOutline>(`Create a practical lesson outline from the following source. Include learning objectives, key concepts, a bulleted breakdown, and a concise summary. Return only JSON matching the supplied schema.\n${source}`, lessonSchema);
  const reference = aiAssets.doc();
  const createdAt = Timestamp.now();
  await reference.set({ id: reference.id, teacherId, type: 'LESSON_OUTLINE', promptInput: input, generatedContent: content, model, createdAt });
  return { assetId: reference.id, type: 'LESSON_OUTLINE', content, model, createdAt: createdAt.toDate().toISOString() };
}

export async function parseAssignmentText(rawText: string): Promise<ParsedAssignment> {
  const safeText = sanitizePromptParts({ rawText }).rawText;
  return generateStructuredJson<ParsedAssignment>(`Parse this OCR text from a student's homework or schedule. Extract subject, a concise assignmentTitle, cleaned extractedDescription, detectedDueDate as an ISO-8601 timestamp or null when ambiguous, and actionable actionItems. Return only JSON matching this shape: {"subject":"string","assignmentTitle":"string","extractedDescription":"string","detectedDueDate":"string|null","actionItems":["string"]}. OCR text:\n${safeText}`, {
    type: 'object', properties: {
      subject: { type: 'string' }, assignmentTitle: { type: 'string' }, extractedDescription: { type: 'string' },
      detectedDueDate: { type: 'string', nullable: true }, actionItems: { type: 'array', items: { type: 'string' } },
    }, required: ['subject', 'assignmentTitle', 'extractedDescription', 'detectedDueDate', 'actionItems'],
  });
}
