export type DegradationMode = 'NORMAL' | 'DEGRADED' | 'CRITICAL';

export interface TelemetrySignal {
  errorRate: number;
  latencyP99: number;
  cpuUsage: number;
  memoryUsage: number;
  redisMemoryUsage: number;
}

export interface DegradationState {
  mode: DegradationMode;
  disabledFeatures: string[];
  reason: string;
}

export class GracefulDegradationController {
  evaluate(signal: TelemetrySignal): DegradationState {
    const severeLoad =
      signal.errorRate > 0.12 ||
      signal.latencyP99 > 2000 ||
      signal.cpuUsage > 0.9 ||
      signal.memoryUsage > 0.85 ||
      signal.redisMemoryUsage > 0.85;

    const criticalLoad =
      signal.errorRate > 0.2 ||
      signal.latencyP99 > 3000 ||
      signal.cpuUsage > 0.96 ||
      signal.memoryUsage > 0.92 ||
      signal.redisMemoryUsage > 0.92;

    if (criticalLoad) {
      return {
        mode: 'CRITICAL',
        disabledFeatures: [
          'leaderboard',
          'avatar-animations',
          'ai-recommendations',
          'real-time-presence',
          'gamification-pulses',
        ],
        reason: 'Critical system saturation; preserving core submission and schedule APIs.',
      };
    }

    if (severeLoad) {
      return {
        mode: 'DEGRADED',
        disabledFeatures: ['leaderboard', 'avatar-animations', 'gamification-pulses'],
        reason: 'Severe load detected; reducing non-essential features to stabilize core workflows.',
      };
    }

    return {
      mode: 'NORMAL',
      disabledFeatures: [],
      reason: 'System operating within target thresholds.',
    };
  }
}
