export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type ToastType = 'success' | 'error' | 'info';

export function dispatchToast(type: ToastType, title: string, message: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('classsync:toast', {
      detail: { type, title, message },
    }),
  );
}

function shouldUseMockApi() {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
  }

  return process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
}

function generateMockResponse<T>(path: string, method: string, payload?: unknown): T {
  const normalizedPath = path.toLowerCase();

  if (normalizedPath.includes('/ai/generate-quiz')) {
    return {
      assetId: 'mock-quiz-1',
      type: 'QUIZ',
      model: 'mock-gemini',
      createdAt: new Date().toISOString(),
      content: {
        title: 'Demo quiz',
        questions: [
          {
            id: 'q-1',
            prompt: 'Nếu x + 3 = 10, giá trị của x là gì?',
            choices: ['5', '7', '10', '13'],
            correctIndex: 1,
          },
        ],
      },
    } as T;
  }

  if (normalizedPath.includes('/classes')) {
    return {
      id: 'mock-class-1',
      name: 'Toán 10A',
      code: 'MATH10A',
      createdAt: new Date().toISOString(),
      members: 32,
    } as T;
  }

  if (normalizedPath.includes('/assignments')) {
    return {
      id: 'mock-assignment-1',
      title: payload && typeof payload === 'object' && 'title' in (payload as Record<string, unknown>) ? String((payload as Record<string, unknown>).title) : 'Bài tập demo',
      status: 'draft',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    } as T;
  }

  if (normalizedPath.includes('/student/schedule')) {
    return [{ id: 'lesson-1', title: 'Toán học', start: '08:00', end: '09:15', room: 'A203' }] as T;
  }

  if (normalizedPath.includes('/ocr/parse-assignment')) {
    return {
      subject: 'Toán',
      assignmentTitle: 'Bài tập về nhà',
      extractedText: 'Học sinh xác định nghiệm của phương trình bậc nhất.',
      detectedDueDate: null,
      actionItems: ['Kiểm tra lại đáp án', 'Nộp trước 17:00'],
    } as T;
  }

  if (method === 'POST') {
    return { ok: true, message: 'Mock API response', payload } as T;
  }

  return { ok: true, items: [] } as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const method = (init.method ?? 'GET').toUpperCase();

  if (typeof window !== 'undefined' && shouldUseMockApi()) {
    localStorage.setItem('classsync.mock-token', 'mock-teacher-token');
  }

  if (shouldUseMockApi()) {
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    const mockData = generateMockResponse<T>(path, method, body);

    console.warn(`[ClassSync API Mock] ${method} ${url}`);
    dispatchToast('info', 'Dùng mode demo', 'Frontend đang chạy fallback mock API để giữ trải nghiệm tương tác.');

    return Promise.resolve(mockData);
  }

  const headers = new Headers(init.headers ?? {});
  const token = typeof window !== 'undefined' ? localStorage.getItem('classsync.mock-token') : null;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(init.body instanceof FormData) && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
    const message = typeof errorBody?.error === 'string' ? errorBody.error : 'Request failed';

    console.error(`[ClassSync API Error] ${method} ${url}`, message);
    dispatchToast('error', 'API request failed', message);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
