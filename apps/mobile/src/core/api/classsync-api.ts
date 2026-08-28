export interface AuthTokenProvider { getIdToken(): Promise<string | null>; }

export interface QuizInput { topic: string; gradeLevel: string; numQuestions: number; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; }
export interface OcrResult { subject: string; assignmentTitle: string; extractedDescription: string; detectedDueDate: string | null; actionItems: string[]; extractedText?: string; }

export class ClassSyncApi {
  constructor(private readonly baseUrl: string, private readonly tokenProvider: AuthTokenProvider) {}

  async parseAssignment(imageBase64: string): Promise<OcrResult> { return this.request<OcrResult>('/ocr/parse-assignment', { method: 'POST', body: JSON.stringify({ imageBase64 }) }); }
  async generateQuiz(input: QuizInput): Promise<unknown> { return this.request('/ai/generate-quiz', { method: 'POST', body: JSON.stringify(input) }); }

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const token = await this.tokenProvider.getIdToken();
    const response = await fetch(`${this.baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) } });
    if (!response.ok) throw new Error(`ClassSync API request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
}
