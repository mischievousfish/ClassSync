export interface WearableReadingInput {
  hrvMs: number;
  restingHr: number;
  sleepHours: number;
  errorRate: number;
  activeMinutes: number;
  consentGranted: boolean;
}

export interface WearableHealthSummary {
  stressIndex: number;
  focusRecommendation: string;
  sleepImpact: 'deprived' | 'moderate' | 'at-risk' | 'strong';
  confidence: number;
  consentCompliant: boolean;
}

export class HealthBiosignalService {
  processWearableReadings(input: WearableReadingInput): WearableHealthSummary {
    const stressIndex = clamp(
      18 +
        (input.restingHr > 70 ? 18 : 0) +
        (input.hrvMs < 30 ? 22 : 8) +
        (input.errorRate > 0.3 ? 24 : 0) +
        (input.activeMinutes > 120 ? 12 : 0),
      0,
      100,
    );

    const sleepImpact = input.sleepHours < 5.5
      ? 'deprived'
      : input.sleepHours < 6.5
        ? 'at-risk'
        : input.sleepHours < 7.5
          ? 'moderate'
          : 'strong';

    const focusRecommendation = stressIndex > 75
      ? 'Schedule a break and reduce cognitive load for the next 10 minutes.'
      : stressIndex > 55
        ? 'Maintain brief check-ins and support the student with a simpler task.'
        : 'Student is in a stable study window; continue with moderate challenge.';

    return {
      stressIndex: Math.round(stressIndex),
      focusRecommendation,
      sleepImpact,
      confidence: input.consentGranted ? 0.95 : 0.0,
      consentCompliant: input.consentGranted,
    };
  }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
