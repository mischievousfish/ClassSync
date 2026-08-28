export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio?: number;
}

export function retryDelay(attempt: number, options: RetryOptions): number {
  const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * (2 ** Math.max(0, attempt - 1)));
  const jitter = exponential * (options.jitterRatio ?? 0.25) * Math.random();
  return Math.round(exponential + jitter);
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error && /invalid|not found|permission denied|unauthorized/i.test(error.message)) return false;
  return true;
}

export async function withRetry<T>(operation: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try { return await operation(attempt); }
    catch (error) {
      lastError = error;
      if (attempt === options.maxAttempts || !isRetryableError(error)) break;
      await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt, options)));
    }
  }
  throw lastError;
}
