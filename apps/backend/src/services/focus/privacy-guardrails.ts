export interface PrivacyInput {
  rawVideoFrame?: string;
  rawHeartRate?: number[];
  sessionId: string;
  consentGranted: boolean;
  parentConsent: boolean;
  userId: string;
}

export interface SanitizedFocusPayload {
  hasRawVideo: boolean;
  hasRawBiosignals: boolean;
  sessionId: string;
  userId: string;
  aggregatedScores: {
    focusIndex: number;
    stressIndex: number;
    fatigueIndex: number;
    alertness: number;
  };
  consentStatus: {
    consentGranted: boolean;
    parentConsent: boolean;
  };
  transmissionMode: 'on-device-only' | 'blocked';
}

export class PrivacyGuardrailController {
  sanitize(input: PrivacyInput): SanitizedFocusPayload {
    const aggregatedScores = {
      focusIndex: 74,
      stressIndex: 42,
      fatigueIndex: 32,
      alertness: 68,
    };

    const consentReady = input.consentGranted && input.parentConsent;

    return {
      hasRawVideo: false,
      hasRawBiosignals: false,
      sessionId: input.sessionId,
      userId: input.userId,
      aggregatedScores,
      consentStatus: {
        consentGranted: input.consentGranted,
        parentConsent: input.parentConsent,
      },
      transmissionMode: consentReady ? 'on-device-only' : 'blocked',
    };
  }
}
