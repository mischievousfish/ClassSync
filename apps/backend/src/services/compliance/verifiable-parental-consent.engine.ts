export type ComplianceRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ORG_ADMIN';

export interface AgeGateInput {
  studentId: string;
  dateOfBirth: string;
  country: string;
  isStudentRecordComplete: boolean;
}

export interface AgeGateEvaluationResult {
  allowed: boolean;
  requiredConsent: boolean;
  parentalConsentRequired: boolean;
  parentInvitationSent: boolean;
  requirement: string;
  ageYears?: number;
  localThreshold: number;
}

export interface ParentConsentVerification {
  parentUserId: string;
  studentId: string;
  smsOtpVerified: boolean;
  idHashVerified: boolean;
  microPaymentAuthorized: boolean;
  consentGrantedAt?: string;
}

export interface ParentConsentVerificationResult {
  granted: boolean;
  consentStatus: 'PENDING' | 'GRANTED' | 'REVOKED';
  reason?: string;
  consentGrantedAt?: string;
}

export class VerifiableParentalConsentEngine {
  private static readonly DEFAULT_MIN_AGE = 13;

  evaluateAgeGate(input: AgeGateInput): AgeGateEvaluationResult {
    const dob = new Date(input.dateOfBirth);
    const ageYears = Number((((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))).toFixed(2));
    const localThreshold = input.country === 'US' ? 13 : VerifiableParentalConsentEngine.DEFAULT_MIN_AGE;
    const requiredConsent = !input.isStudentRecordComplete || ageYears < localThreshold;

    return {
      allowed: !requiredConsent,
      requiredConsent,
      parentalConsentRequired: requiredConsent,
      parentInvitationSent: requiredConsent,
      requirement: requiredConsent
        ? 'Parent or legal guardian consent required before activation for minors under the jurisdictional age threshold.'
        : 'Student account is eligible for direct activation.',
      ageYears: Number(ageYears.toFixed(2)),
      localThreshold,
    };
  }

  verifyParentConsent(input: ParentConsentVerification): ParentConsentVerificationResult {
    const isVerified = input.smsOtpVerified && (input.idHashVerified || input.microPaymentAuthorized);

    if (!isVerified) {
      return { granted: false, consentStatus: 'PENDING', reason: 'Verification incomplete: OTP plus legal verification required.' };
    }

    return {
      granted: true,
      consentStatus: 'GRANTED',
      consentGrantedAt: new Date().toISOString(),
    };
  }

  revokeConsent(parentUserId: string, studentId: string): { revoked: boolean; consentStatus: 'REVOKED'; parentUserId: string; studentId: string } {
    return {
      revoked: true,
      consentStatus: 'REVOKED',
      parentUserId,
      studentId,
    };
  }
}
