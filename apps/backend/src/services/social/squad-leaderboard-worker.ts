export interface SquadMemberSummary {
  studentId: string;
  xpEarned: number;
  studyStreakDays: number;
}

export interface SquadLeaderboardEntry {
  squadId: string;
  totalXP: number;
  weekTargetXP: number;
  members: SquadMemberSummary[];
  rank: number;
  bossQuestUnlocked: boolean;
}

export class SquadLeaderboardWorker {
  evaluateLeaderboard(squads: Array<{ id: string; weeklyTargetXP: number; memberStudentIds: string[]; totalSquadXP: number }>, memberXp: Record<string, number>, streaks: Record<string, number>): SquadLeaderboardEntry[] {
    const entries = squads.map((squad) => {
      const members = squad.memberStudentIds.map((studentId) => ({
        studentId,
        xpEarned: memberXp[studentId] ?? 0,
        studyStreakDays: streaks[studentId] ?? 0,
      }));

      const totalXP = members.reduce((sum, member) => sum + member.xpEarned, 0);
      const bossQuestUnlocked = totalXP >= squad.weeklyTargetXP;

      return {
        squadId: squad.id,
        totalXP,
        weekTargetXP: squad.weeklyTargetXP,
        members,
        rank: 0,
        bossQuestUnlocked,
      };
    });

    return entries
      .sort((left, right) => right.totalXP - left.totalXP)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  createBossQuest(questName: string, requiredXP: number, requiredProblemCount: number): { questName: string; requiredXP: number; requiredProblemCount: number; reward: string } {
    return {
      questName,
      requiredXP,
      requiredProblemCount,
      reward: 'Dragon Slayer Avatar Frame',
    };
  }
}
