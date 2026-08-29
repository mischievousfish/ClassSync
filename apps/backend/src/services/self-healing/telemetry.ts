export type MetricName =
  | 'http_5xx_rate'
  | 'api_latency_p99_ms'
  | 'firebase_read_latency_ms'
  | 'firebase_write_latency_ms'
  | 'gemini_rate_limit_429'
  | 'cpu_usage'
  | 'memory_usage'
  | 'redis_memory_usage'
  | 'db_read_latency_ms';

export interface TelemetryPoint {
  timestamp: number;
  value: number;
}

export interface AnomalyEvent {
  metric: MetricName;
  currentValue: number;
  mean: number;
  stdDev: number;
  zScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
}

export interface TelemetryDaemonOptions {
  windowSize?: number;
  zScoreThreshold?: number;
  flushIntervalMs?: number;
}

export class SelfHealingTelemetryDaemon {
  private readonly history = new Map<MetricName, TelemetryPoint[]>();
  private readonly windowSize: number;
  private readonly zScoreThreshold: number;
  private readonly flushIntervalMs: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(options: TelemetryDaemonOptions = {}) {
    this.windowSize = options.windowSize ?? 60;
    this.zScoreThreshold = options.zScoreThreshold ?? 3;
    this.flushIntervalMs = options.flushIntervalMs ?? 5_000;
  }

  start(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      for (const metric of this.history.keys()) {
        this.detectAnomaly(metric);
      }
    }, this.flushIntervalMs);
  }

  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  record(metric: MetricName, value: number): TelemetryPoint {
    const point: TelemetryPoint = { timestamp: Date.now(), value };
    const current = this.history.get(metric) ?? [];
    current.push(point);
    if (current.length > this.windowSize) {
      current.shift();
    }
    this.history.set(metric, current);
    return point;
  }

  getSeries(metric: MetricName): TelemetryPoint[] {
    return [...(this.history.get(metric) ?? [])];
  }

  detectAnomaly(metric: MetricName): AnomalyEvent | null {
    const values = this.getSeries(metric);
    if (values.length < 5) return null;

    const currentValue = values[values.length - 1].value;
    const mean = values.reduce((sum, point) => sum + point.value, 0) / values.length;
    const variance = values.reduce((sum, point) => sum + (point.value - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const zScore = stdDev === 0 ? 0 : (currentValue - mean) / stdDev;

    const absZ = Math.abs(zScore);
    if (absZ < this.zScoreThreshold) return null;

    const severity: AnomalyEvent['severity'] = absZ >= 7 ? 'CRITICAL' : absZ >= 5 ? 'HIGH' : absZ >= 3.5 ? 'MEDIUM' : 'LOW';

    return {
      metric,
      currentValue,
      mean,
      stdDev,
      zScore,
      severity,
      timestamp: values[values.length - 1].timestamp,
    };
  }

  getSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const [metric, values] of this.history.entries()) {
      if (values.length === 0) continue;
      const last = values[values.length - 1];
      snapshot[metric] = last.value;
    }
    return snapshot;
  }
}
