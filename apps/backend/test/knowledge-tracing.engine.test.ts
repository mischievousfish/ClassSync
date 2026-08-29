import { KnowledgeTracingEngine } from '../src/services/knowledge-tracing.engine';

describe('KnowledgeTracingEngine', () => {
  it('raises mastery after correct observations and lowers it after errors', () => {
    const engine = new KnowledgeTracingEngine({ forgettingHalfLifeDays: 45 });
    const start = new Date('2026-01-01T00:00:00.000Z');
    const afterCorrect = engine.estimate('quadratic-functions', [{ topic: 'quadratic-functions', correct: true, observedAt: start }], start);
    const afterError = engine.estimate('quadratic-functions', [{ topic: 'quadratic-functions', correct: true, observedAt: start }, { topic: 'quadratic-functions', correct: false, observedAt: new Date('2026-01-02T00:00:00.000Z') }], new Date('2026-01-02T00:00:00.000Z'));
    expect(afterCorrect.mastery).toBeGreaterThan(20);
    expect(afterError.mastery).toBeLessThan(afterCorrect.mastery);
  });

  it('applies forgetting decay when a topic is not practiced', () => {
    const engine = new KnowledgeTracingEngine({ priorMastery: 1, forgettingHalfLifeDays: 10 });
    const estimate = engine.estimate('topic', [], new Date('2026-02-01T00:00:00.000Z'));
    expect(estimate.mastery).toBe(100);
    const decayed = engine.estimate('topic', [{ topic: 'topic', correct: true, observedAt: new Date('2026-01-01T00:00:00.000Z') }], new Date('2026-02-01T00:00:00.000Z'));
    expect(decayed.mastery).toBeLessThan(100);
  });
});