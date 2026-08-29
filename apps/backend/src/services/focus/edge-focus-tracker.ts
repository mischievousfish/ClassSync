export interface EdgeFocusFrameInput {
  yaw: number;
  pitch: number;
  roll: number;
  leftEar: number;
  rightEar: number;
  expression: string;
  gazeConfidence: number;
  isScreenFocused: boolean;
}

export interface EdgeFocusFrameResult {
  focusIndex: number;
  fatigueIndex: number;
  alertness: number;
  gazeDirection: 'screen' | 'away';
  microExpression: string;
  distractionReason?: string;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export class EdgeFocusTracker {
  evaluateFrame(input: EdgeFocusFrameInput): EdgeFocusFrameResult {
    const gazeDrift = Math.abs(input.yaw) + Math.abs(input.pitch) + Math.abs(input.roll) * 0.6;
    const gazePenalty = input.isScreenFocused ? 8 : 24;
    const confidencePenalty = input.gazeConfidence < 0.7 ? 18 : 0;
    const expressionPenalty = /frustrat|bored|confus|distract/i.test(input.expression) ? 18 : 0;

    const focusIndex = clamp(
      100 -
        (gazeDrift * 0.7 + gazePenalty + confidencePenalty + expressionPenalty + (input.yaw > 25 || input.pitch > 18 ? 8 : 0)),
      0,
      100,
    );

    const earMean = (input.leftEar + input.rightEar) / 2;
    const fatigueIndex = clamp(
      45 +
        (0.22 - earMean) * 450 +
        (input.expression.includes('sleepy') ? 18 : 0) +
        (input.yaw > 20 || input.pitch > 20 ? 12 : 0),
      0,
      100,
    );

    const alertness = clamp(100 - (fatigueIndex * 0.55) - (100 - focusIndex) * 0.45, 0, 100);

    return {
      focusIndex: Math.round(focusIndex),
      fatigueIndex: Math.round(fatigueIndex),
      alertness: Math.round(alertness),
      gazeDirection: input.isScreenFocused ? 'screen' : 'away',
      microExpression: input.expression,
      distractionReason: input.isScreenFocused ? undefined : 'Student gaze drifted away from study material.',
    };
  }
}
