export type TutorIntent = 'ASK_HOMEWORK_HELP' | 'EXPLAIN_CONCEPT' | 'REQUEST_HINT' | 'OFF_TOPIC_CHAT' | 'EXAM_PREP';
export type StudentLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface StudentMastery {
  level: StudentLevel;
  weakTopics: string[];
}

export interface TutorRunInput {
  userId: string;
  classId: string;
  message: string;
  studentMastery?: StudentMastery;
  problemContext?: string;
}

export interface TutorRunResult {
  intent: TutorIntent;
  response: string;
  toolOutput?: Record<string, unknown>;
}

export interface SocraticPromptInput {
  studentLevel: StudentLevel;
  concept: string;
  misconceptions: string[];
  requestedAction: TutorIntent | 'REQUEST_HINT' | 'EXPLAIN_CONCEPT';
}

export class IntentClassifierNode {
  classify(message: string): TutorIntent {
    const text = message.toLowerCase();
    if (/exam|test|quiz prep|revision|study plan/.test(text)) return 'EXAM_PREP';
    if (/help me|help with|understand|difficult|homework|problem/.test(text)) return 'ASK_HOMEWORK_HELP';
    if (/explain|what is|why does|how does|concept/.test(text)) return 'EXPLAIN_CONCEPT';
    if (/hint|clue|where do i begin|i am stuck/.test(text)) return 'REQUEST_HINT';
    if (/hello|hi|chat|random|weather|movie|sports/.test(text)) return 'OFF_TOPIC_CHAT';
    return 'ASK_HOMEWORK_HELP';
  }
}

export class SafetyGuardrailNode {
  intercept(input: { message: string; intent: TutorIntent; studentMastery?: StudentMastery }): { blocked: boolean; redirectHint: string; replacementPrompt: string } {
    const text = input.message.toLowerCase();
    const directAnswerPatterns = [
      /give me the answer/i,
      /final answer/i,
      /solve question \d+/i,
      /what is the correct answer/i,
      /just tell me the solution/i,
    ];

    if (directAnswerPatterns.some((pattern) => pattern.test(text))) {
      const redirect = 'Let’s start by identifying the key idea and the first safe step, not the final answer.';
      const replacement = `I can help you reason through it. What is the first thing you notice about ${input.studentMastery?.weakTopics?.[0] ?? 'this problem'}?`;
      return { blocked: true, redirectHint: redirect, replacementPrompt: replacement };
    }

    return { blocked: false, redirectHint: 'Let’s continue with a guided step.', replacementPrompt: input.message };
  }
}

export class SocraticNodeRules {
  buildPrompt(input: SocraticPromptInput): string {
    const levelHint = this.getLevelHint(input.studentLevel);
    const misconceptionLine = input.misconceptions.length
      ? `Start by addressing the misconception around ${input.misconceptions.join(', ')} without jumping to the answer.`
      : 'Start with the core principle and ask one diagnostic question before any calculation.';

    const actionLine = input.requestedAction === 'REQUEST_HINT'
      ? 'Give a brief hint that narrows the next action, not the final result.'
      : input.requestedAction === 'EXPLAIN_CONCEPT'
        ? 'Explain the underlying concept in plain language and connect it to a familiar analogy.'
        : 'Guide the learner through a short sequence of questions and let them discover the next step.';

    return `You are a Socratic tutor for a ${input.studentLevel.toLowerCase()} student. Help them understand ${input.concept}. ${levelHint} ${misconceptionLine} ${actionLine}`;
  }

  private getLevelHint(level: StudentLevel): string {
    if (level === 'BEGINNER') return 'Use simple language, one concept at a time, and frame each idea with a concrete example.';
    if (level === 'INTERMEDIATE') return 'Connect the concept to a worked example and ask the learner to compare their reasoning against a similar structure.';
    return 'Challenge the learner to justify each step, compare multiple strategies, and reason about edge cases.';
  }
}

export class TutorTools {
  search_textbook_rag(query: string, classId: string): { classId: string; summary: string; relatedConcepts: string[] } {
    const normalized = query.trim() || 'the current topic';
    return {
      classId,
      summary: `Review the curriculum concept behind “${normalized}” and connect it to the class objective before solving the next step.`,
      relatedConcepts: ['definition', 'worked example', 'common mistake', 'check your reasoning'],
    };
  }

  generate_practice_variant(problemStatement: string): { problem: string; goal: string } {
    const cleaned = problemStatement.trim() || 'Solve the given problem';
    const variant = cleaned.includes('?')
      ? cleaned.replace(/\?$/, ' in a similar way?')
      : `${cleaned} in a similar format.`;

    return {
      problem: `Solve a similar problem: ${variant}`,
      goal: 'Practice the same concept without copying the original answer.',
    };
  }

  evaluate_math_step(latexExpression: string): { isCorrect: boolean; result?: number; reason: string } {
    const trimmed = (latexExpression ?? '').trim();
    if (!trimmed) return { isCorrect: false, reason: 'No math expression was provided.' };

    const normalized = trimmed
      .replace(/\\cdot/g, '*')
      .replace(/\\times/g, '*')
      .replace(/\\div/g, '/')
      .replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\left|\\right|\$/g, '')
      .replace(/\s+/g, '');

    const match = normalized.match(/=\s*(.+)$/);
    const expression = match ? match[1] : normalized;
    if (!/[0-9+\-*/().]/.test(expression)) {
      return { isCorrect: false, reason: 'The expression is not a valid arithmetic step.' };
    }

    try {
      const result = Function(`"use strict"; return (${expression})`)();
      if (typeof result !== 'number' || Number.isNaN(result)) {
        return { isCorrect: false, reason: 'The expression does not evaluate to a numeric value.' };
      }
      return { isCorrect: true, result, reason: 'This arithmetic step is valid.' };
    } catch {
      return { isCorrect: false, reason: 'This step is not valid; check the order of operations or the algebraic transformation.' };
    }
  }
}

export class AgenticTutorGraph {
  constructor(
    private readonly classifier = new IntentClassifierNode(),
    private readonly guardrail = new SafetyGuardrailNode(),
    private readonly rules = new SocraticNodeRules(),
    private readonly tools = new TutorTools(),
  ) {}

  run(input: TutorRunInput): TutorRunResult {
    const intent = this.classifier.classify(input.message);
    const safety = this.guardrail.intercept({ message: input.message, intent, studentMastery: input.studentMastery });
    const mastery = input.studentMastery ?? { level: 'BEGINNER', weakTopics: [] };
    const concept = input.problemContext ?? 'the current homework problem';

    if (safety.blocked) {
      const response = [
        safety.redirectHint,
        'Ask yourself: what is the concept behind this problem, and what is the first step that makes sense?',
        'Try checking the definition or a simpler example before doing any algebra.',
      ].join(' ');

      return { intent, response, toolOutput: { safety } };
    }

    const learnedContext = this.tools.search_textbook_rag(input.message, input.classId);
    const practiceVariant = this.tools.generate_practice_variant(input.problemContext ?? input.message);
    const prompt = this.rules.buildPrompt({
      studentLevel: mastery.level,
      concept,
      misconceptions: mastery.weakTopics.length ? mastery.weakTopics : ['basic setup'],
      requestedAction: intent === 'EXPLAIN_CONCEPT' ? 'EXPLAIN_CONCEPT' : 'REQUEST_HINT',
    });

    const response = [
      'Let’s start with a small, useful question.',
      prompt,
      `Use the idea from the textbook summary: ${learnedContext.summary}`,
      `Try this guided step: ${practiceVariant.problem}`,
      'When you have one intermediate step, I can help you check whether it is mathematically valid.',
    ].join(' ');

    return {
      intent,
      response,
      toolOutput: { learnedContext, practiceVariant },
    };
  }
}
