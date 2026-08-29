export interface AdaptiveInterventionInput {
  focusIndex: number;
  stressIndex: number;
  fatigueIndex: number;
  consecutiveMinutesLowFocus: number;
  supportsOnDeviceProcessing: boolean;
}

export interface AdaptiveInterventionResult {
  shouldTriggerBreak: boolean;
  shouldReduceDifficulty: boolean;
  breakType: string;
  difficultyAdjustment: string;
  preserveCoreWorkflow: boolean;
}

export class AdaptiveInterventionEngine {
  evaluate(input: AdaptiveInterventionInput): AdaptiveInterventionResult {
    const lowFocus = input.focusIndex < 30 || input.consecutiveMinutesLowFocus >= 10;
    const highStress = input.stressIndex > 85;
    const highFatigue = input.fatigueIndex > 70;

    const shouldTriggerBreak = lowFocus || highStress || highFatigue;
    const shouldReduceDifficulty = input.stressIndex > 78 || input.fatigueIndex > 68 || input.focusIndex < 35;

    return {
      shouldTriggerBreak,
      shouldReduceDifficulty,
      breakType: shouldTriggerBreak ? 'Mindfulness and brain-stretch break' : 'Continue with current flow',
      difficultyAdjustment: shouldReduceDifficulty
        ? 'Reduce question difficulty and provide supportive hints with shorter tasks.'
        : 'Keep current difficulty and offer a challenge ramp when attention stabilizes.',
      preserveCoreWorkflow: input.supportsOnDeviceProcessing,
    };
  }
}
