export type TutoringStatus = 'REQUESTED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface PeerTutoringSession {
  id: string;
  tutorStudentId: string;
  tuteeStudentId: string;
  subject: string;
  topicId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: TutoringStatus;
  coinEscrowAmount: number;
  tuteeRating?: number;
}

export interface MatchCandidate {
  tutorStudentId: string;
  tuteeStudentId: string;
  topicId: string;
  tutorScore: number;
  tuteeScore: number;
  fitScore: number;
}

export interface TutoringCompletionResult {
  sessionId: string;
  escrowReleased: boolean;
  coinsTransferred: number;
  bonusXpAwarded: number;
  tutorReward: string;
}

export class PeerTutoringEscrowEngine {
  findMatches(tutors: Array<{ studentId: string; topicId: string; score: number }>, tutees: Array<{ studentId: string; topicId: string; score: number }>): MatchCandidate[] {
    const matches: MatchCandidate[] = [];

    for (const tutor of tutors.filter((entry) => entry.score >= 90)) {
      for (const tutee of tutees.filter((entry) => entry.topicId === tutor.topicId && entry.score < 50)) {
        matches.push({
          tutorStudentId: tutor.studentId,
          tuteeStudentId: tutee.studentId,
          topicId: tutor.topicId,
          tutorScore: tutor.score,
          tuteeScore: tutee.score,
          fitScore: tutor.score - tutee.score,
        });
      }
    }

    return matches.sort((left, right) => right.fitScore - left.fitScore);
  }

  createSession(session: Omit<PeerTutoringSession, 'status'> & { status?: TutoringStatus }): PeerTutoringSession {
    return {
      ...session,
      status: session.status ?? 'REQUESTED',
      coinEscrowAmount: session.coinEscrowAmount ?? 50,
    };
  }

  completeSession(session: PeerTutoringSession): TutoringCompletionResult {
    const positiveReview = (session.tuteeRating ?? 0) >= 4;
    const released = session.status === 'COMPLETED' && positiveReview;

    if (!released) {
      return {
        sessionId: session.id,
        escrowReleased: false,
        coinsTransferred: 0,
        bonusXpAwarded: 0,
        tutorReward: 'No payout: review below 4 stars or session incomplete.',
      };
    }

    const coinsTransferred = session.coinEscrowAmount + 30;
    const bonusXpAwarded = 120 + Math.round(session.durationMinutes * 1.5);

    return {
      sessionId: session.id,
      escrowReleased: true,
      coinsTransferred,
      bonusXpAwarded,
      tutorReward: `Tutor received ${coinsTransferred} coins and ${bonusXpAwarded} XP.`,
    };
  }
}
