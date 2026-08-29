export interface StudySquad {
  id: string;
  name: string;
  avatarUrl?: string;
  creatorStudentId: string;
  memberStudentIds: string[];
  totalSquadXP: number;
  weeklyTargetXP: number;
  activeChallengeId?: string;
  squadRank?: number;
}

export interface SquadMemberPerformance {
  studentId: string;
  xpEarned: number;
  streakDays: number;
  topicMastery: Record<string, number>;
}

export class StudySquadService {
  createSquad(input: Pick<StudySquad, 'id' | 'name' | 'creatorStudentId' | 'memberStudentIds' | 'weeklyTargetXP'>): StudySquad {
    return {
      id: input.id,
      name: input.name,
      avatarUrl: `https://cdn.classsync.app/squads/${input.id}.png`,
      creatorStudentId: input.creatorStudentId,
      memberStudentIds: [...new Set(input.memberStudentIds)],
      totalSquadXP: 0,
      weeklyTargetXP: input.weeklyTargetXP,
      activeChallengeId: undefined,
      squadRank: 0,
    };
  }

  addMember(squad: StudySquad, studentId: string): StudySquad {
    if (!squad.memberStudentIds.includes(studentId)) {
      squad.memberStudentIds.push(studentId);
    }
    return squad;
  }

  computeWeeklyStatus(squad: StudySquad, members: SquadMemberPerformance[]): { totalXP: number; targetMet: boolean; averageStreak: number } {
    const totalXP = members.reduce((sum, member) => sum + member.xpEarned, 0);
    const averageStreak = members.length > 0
      ? members.reduce((sum, member) => sum + member.streakDays, 0) / members.length
      : 0;

    return {
      totalXP,
      targetMet: totalXP >= squad.weeklyTargetXP,
      averageStreak: Number(averageStreak.toFixed(1)),
    };
  }
}
