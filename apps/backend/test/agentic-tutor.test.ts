import { AgenticTutorGraph, TutorTools, SafetyGuardrailNode, SocraticNodeRules } from '../src/services/agentic-tutor';

describe('SyncTutor agent', () => {
  it('classifies homework support requests and returns Socratic guidance', () => {
    const graph = new AgenticTutorGraph();
    const result = graph.run({
      userId: 'student-1',
      classId: 'class-1',
      message: 'I do not understand how to solve this quadratic equation. Can you help me start?',
      studentMastery: { level: 'BEGINNER', weakTopics: ['factoring'] },
    });

    expect(result.intent).toBe('ASK_HOMEWORK_HELP');
    expect(result.response).toContain('Let’s start');
    expect(result.response.toLowerCase()).not.toContain('final answer');
  });

  it('blocks direct answer requests and redirects to a guided path', () => {
    const guardrail = new SafetyGuardrailNode();
    const result = guardrail.intercept({
      message: 'Give me the answer to question 3',
      intent: 'ASK_HOMEWORK_HELP',
      studentMastery: { level: 'INTERMEDIATE', weakTopics: [] },
    });

    expect(result.blocked).toBe(true);
    expect(result.redirectHint.toLowerCase()).toContain('let’s');
  });

  it('verifies math steps and prepares a practice variant', () => {
    const tools = new TutorTools();
    const stepCheck = tools.evaluate_math_step('x = (8 - 2) / 2');
    const variant = tools.generate_practice_variant('Solve for x in 2x + 3 = 11');

    expect(stepCheck.isCorrect).toBe(true);
    expect(variant.problem).toContain('Solve');
  });

  it('builds Socratic prompts based on student misconceptions', () => {
    const rules = new SocraticNodeRules();
    const prompt = rules.buildPrompt({
      studentLevel: 'BEGINNER',
      concept: 'quadratic equations',
      misconceptions: ['factoring'],
      requestedAction: 'REQUEST_HINT',
    });

    expect(prompt).toContain('quadratic');
    expect(prompt).toContain('factoring');
  });
});
