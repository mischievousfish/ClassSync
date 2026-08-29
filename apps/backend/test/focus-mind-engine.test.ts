import { AdaptiveInterventionEngine } from '../src/services/focus/adaptive-intervention-engine';
import { EdgeFocusTracker } from '../src/services/focus/edge-focus-tracker';
import { HealthBiosignalService } from '../src/services/focus/health-biosignal.service';
import { PrivacyGuardrailController } from '../src/services/focus/privacy-guardrails';

describe('ClassSync FocusMind Engine', () => {
  it('computes attention and fatigue from gaze and blink signals', () => {
    const tracker = new EdgeFocusTracker();

    const result = tracker.evaluateFrame({
      yaw: 32,
      pitch: 18,
      roll: 6,
      leftEar: 0.18,
      rightEar: 0.17,
      expression: 'frustrated',
      gazeConfidence: 0.64,
      isScreenFocused: false,
    });

    expect(result.focusIndex).toBeLessThan(60);
    expect(result.fatigueIndex).toBeGreaterThan(50);
    expect(result.alertness).toBeLessThan(60);
  });

  it('derives stress and sleep-correlation insights from wearable data', () => {
    const service = new HealthBiosignalService();

    const reading = service.processWearableReadings({
      hrvMs: 18,
      restingHr: 74,
      sleepHours: 5.2,
      errorRate: 0.41,
      activeMinutes: 75,
      consentGranted: true,
    });

    expect(reading.stressIndex).toBeGreaterThan(60);
    expect(reading.sleepImpact).toMatch(/deprived|at-risk|moderate/i);
  });

  it('triggers adaptive interventions for low focus and high stress', () => {
    const engine = new AdaptiveInterventionEngine();

    const decision = engine.evaluate({
      focusIndex: 22,
      stressIndex: 88,
      fatigueIndex: 74,
      consecutiveMinutesLowFocus: 12,
      supportsOnDeviceProcessing: true,
    });

    expect(decision.shouldTriggerBreak).toBe(true);
    expect(decision.difficultyAdjustment).toMatch(/reduce|simplify|support/i);
  });

  it('filters raw biometric data behind privacy guardrails', () => {
    const guardrails = new PrivacyGuardrailController();

    const sanitized = guardrails.sanitize({
      rawVideoFrame: 'base64video',
      rawHeartRate: [72, 74, 71],
      sessionId: 'sess-123',
      consentGranted: true,
      parentConsent: true,
      userId: 'student-42',
    });

    expect(sanitized.hasRawVideo).toBe(false);
    expect(sanitized.hasRawBiosignals).toBe(false);
    expect(sanitized.aggregatedScores.focusIndex).toBeGreaterThanOrEqual(0);
    expect(sanitized.aggregatedScores.focusIndex).toBeLessThanOrEqual(100);
  });
});
