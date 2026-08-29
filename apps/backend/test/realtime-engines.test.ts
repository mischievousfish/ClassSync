import { DynamicQRGenerator } from '../src/services/dynamic-qr.generator';
import { QuizBattleEngine } from '../src/services/quiz-battle.engine';

describe('realtime engines', () => {
  it('awards more points to a faster correct answer and ignores duplicates', () => {
    const engine = new QuizBattleEngine();
    const fast = engine.submitAnswer({ sessionId: 's', studentId: 'fast', questionIndex: 0, optionIndex: 1, responseTimeMs: 100, correct: true, timeLimitMs: 10_000 });
    const slow = engine.submitAnswer({ sessionId: 's', studentId: 'slow', questionIndex: 0, optionIndex: 1, responseTimeMs: 5_000, correct: true, timeLimitMs: 10_000 });
    expect(fast.score).toBeGreaterThan(slow.score);
    expect(engine.submitAnswer({ sessionId: 's', studentId: 'fast', questionIndex: 0, optionIndex: 1, responseTimeMs: 100, correct: true, timeLimitMs: 10_000 })).toEqual(fast);
    expect(engine.leaderboard('s')).toHaveLength(2);
  });

  it('rotates and expires dynamic QR tokens every five seconds', () => {
    const generator = new DynamicQRGenerator('test-secret');
    const first = generator.generate('session', 'class', 10_000);
    const second = generator.generate('session', 'class', 15_000);
    expect(first.token).not.toBe(second.token);
    expect(generator.verify(first, 14_999)).toBe(true);
    expect(generator.verify(first, 15_001)).toBe(false);
  });
});