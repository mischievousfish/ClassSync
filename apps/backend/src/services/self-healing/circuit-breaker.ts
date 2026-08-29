export type ProviderStatusCode = 429 | 500 | 503;

export interface CircuitBreakerManagerOptions {
  providers: string[];
  fallbackProvider: string;
  consecutiveFailureThreshold?: number;
  fallbackDelayMs?: number;
}

export class CircuitBreakerFallbackManager {
  private readonly providers: string[];
  private readonly fallbackProvider: string;
  private readonly consecutiveFailureThreshold: number;
  private readonly fallbackDelayMs: number;
  private activeProvider: string;
  private failureCounts = new Map<string, number>();
  private lastFailureAt = new Map<string, number>();
  private readonly statuses = new Map<string, number[]>();

  constructor(options: CircuitBreakerManagerOptions) {
    this.providers = [...options.providers];
    this.fallbackProvider = options.fallbackProvider;
    this.consecutiveFailureThreshold = options.consecutiveFailureThreshold ?? 3;
    this.fallbackDelayMs = options.fallbackDelayMs ?? 500;
    this.activeProvider = this.providers[0] ?? this.fallbackProvider;
  }

  getActiveProvider(): string {
    return this.activeProvider;
  }

  recordFailure(provider: string, statusCode: ProviderStatusCode): void {
    const count = (this.failureCounts.get(provider) ?? 0) + 1;
    this.failureCounts.set(provider, count);
    this.lastFailureAt.set(provider, Date.now());

    const entries = this.statuses.get(provider) ?? [];
    entries.push(statusCode);
    this.statuses.set(provider, entries);

    const isRateLimitedOrUnavailable = statusCode === 429 || statusCode === 503;
    const shouldFallback = isRateLimitedOrUnavailable && count >= this.consecutiveFailureThreshold;

    if (shouldFallback && provider !== this.fallbackProvider) {
      setTimeout(() => {
        this.activeProvider = this.fallbackProvider;
      }, this.fallbackDelayMs);
    }
  }

  recordSuccess(provider: string): void {
    this.failureCounts.set(provider, 0);
  }

  getRecentStatusCodes(provider: string): number[] {
    return [...(this.statuses.get(provider) ?? [])].slice(-10);
  }
}
