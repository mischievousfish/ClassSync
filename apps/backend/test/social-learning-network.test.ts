import { PeerTutoringEscrowEngine } from '../src/services/social/peer-tutoring-escrow-engine';
import { SquadLeaderboardWorker } from '../src/services/social/squad-leaderboard-worker';
import { StudySquadService } from '../src/services/social/study-squad.service';

describe('ClassSync social learning engine', () => {
  it('matches high-scoring tutors with struggling tutees in the same topic', () => {
    const engine = new PeerTutoringEscrowEngine();
    const matches = engine.findMatches(
      [
        { studentId: 't-1', topicId: 'quadratic-equations', score: 97 },
        { studentId: 't-2', topicId: 'heat-transfer', score: 92 },
      ],
      [
        { studentId: 'u-1', topicId: 'quadratic-equations', score: 38 },
        { studentId: 'u-2', topicId: 'heat-transfer', score: 44 },
      ],
    );

    expect(matches[0].tutorStudentId).toBe('t-1');
    expect(matches[0].tuteeStudentId).toBe('u-1');
  });

  it('releases escrow and rewards tutors after positive completion', () => {
    const engine = new PeerTutoringEscrowEngine();
    const result = engine.completeSession({
      id: 'session-1',
      tutorStudentId: 't-1',
      tuteeStudentId: 'u-1',
      subject: 'Math',
      topicId: 'quadratic-equations',
      scheduledAt: '2026-08-29T18:00:00Z',
      durationMinutes: 15,
      status: 'COMPLETED',
      coinEscrowAmount: 80,
      tuteeRating: 5,
    });

    expect(result.escrowReleased).toBe(true);
    expect(result.coinsTransferred).toBeGreaterThan(80);
  });

  it('calculates weekly squad leaderboard totals and boss quest unlocks', () => {
    const worker = new SquadLeaderboardWorker();
    const entries = worker.evaluateLeaderboard(
      [
        { id: 'squad-a', weeklyTargetXP: 600, memberStudentIds: ['a', 'b'], totalSquadXP: 0 },
        { id: 'squad-b', weeklyTargetXP: 700, memberStudentIds: ['c', 'd'], totalSquadXP: 0 },
      ],
      { a: 210, b: 290, c: 360, d: 350 },
      { a: 4, b: 6, c: 3, d: 8 },
    );

    expect(entries[0].squadId).toBe('squad-b');
    expect(entries[0].bossQuestUnlocked).toBe(true);
  });

  it('creates a valid study squad with weekly target metadata', () => {
    const service = new StudySquadService();
    const squad = service.createSquad({
      id: 'squad-1',
      name: 'Night Owls',
      creatorStudentId: 'student-1',
      memberStudentIds: ['student-1', 'student-2'],
      weeklyTargetXP: 500,
    });

    expect(squad.memberStudentIds).toHaveLength(2);
    expect(squad.weeklyTargetXP).toBe(500);
    expect(squad.totalSquadXP).toBe(0);
  });
});
