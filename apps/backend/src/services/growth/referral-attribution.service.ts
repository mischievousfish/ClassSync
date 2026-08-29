export type ReferralStatus = 'INVITED' | 'REGISTERED' | 'ACTIVE_USER';

export interface ReferralLink { userId: string; code: string; status: ReferralStatus; } 

export class ReferralAttributionService {
  static generateReferralCode(userId: string): string {
    return `CS${userId.slice(0, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  static createReferralLink(userId: string): ReferralLink {
    return { userId, code: this.generateReferralCode(userId), status: 'INVITED' };
  }

  static advanceStatus(link: ReferralLink, nextStatus: ReferralStatus): ReferralLink {
    return { ...link, status: nextStatus };
  }

  static evaluateTeacherReward(invitesCount: number): { eligible: boolean; reward: string } {
    if (invitesCount >= 3) {
      return { eligible: true, reward: '1 month Pro Teacher AI Package' };
    }

    return { eligible: false, reward: 'Invite 3 fellow teachers to unlock the Pro Teacher AI Package' };
  }

  static evaluateStudentReward(invitesCount: number): { eligible: boolean; reward: string } {
    if (invitesCount >= 2) {
      return { eligible: true, reward: '5 Streak Freeze Tokens + 500 Gamification Coins' };
    }

    return { eligible: false, reward: 'Invite 2 classmates to unlock streak freeze tokens and coins' };
  }
}
