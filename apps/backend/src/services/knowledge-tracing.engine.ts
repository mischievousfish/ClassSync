export interface BktParameters {
  priorMastery?: number;
  learnProbability?: number;
  guessProbability?: number;
  slipProbability?: number;
  forgettingHalfLifeDays?: number;
}

export interface KnowledgeObservation {
  topic: string;
  correct: boolean;
  observedAt: Date;
}

export interface MasteryEstimate {
  topic: string;
  mastery: number;
  observations: number;
  lastPracticedAt?: string;
}

const defaults: Required<BktParameters> = { priorMastery: 0.2, learnProbability: 0.15, guessProbability: 0.2, slipProbability: 0.1, forgettingHalfLifeDays: 45 };

function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }

export class KnowledgeTracingEngine {
  private readonly parameters: Required<BktParameters>;

  constructor(parameters: BktParameters = {}) {
    this.parameters = { ...defaults, ...parameters };
    if (this.parameters.guessProbability + this.parameters.slipProbability >= 1) throw new Error('BKT guess + slip must be below 1');
  }

  estimate(topic: string, observations: KnowledgeObservation[], asOf = new Date()): MasteryEstimate {
    const ordered = observations.filter((observation) => observation.topic === topic).sort((left, right) => left.observedAt.getTime() - right.observedAt.getTime());
    let mastery = clamp(this.parameters.priorMastery);
    let lastPracticedAt: Date | undefined;
    for (const observation of ordered) {
      if (lastPracticedAt) mastery = this.applyDecay(mastery, (observation.observedAt.getTime() - lastPracticedAt.getTime()) / 86_400_000);
      const correctLikelihood = mastery * (1 - this.parameters.slipProbability);
      const incorrectLikelihood = (1 - mastery) * this.parameters.guessProbability;
      const evidence = observation.correct ? correctLikelihood + incorrectLikelihood : mastery * this.parameters.slipProbability + (1 - mastery) * (1 - this.parameters.guessProbability);
      const posterior = observation.correct ? correctLikelihood / evidence : mastery * this.parameters.slipProbability / evidence;
      mastery = clamp(posterior + (1 - posterior) * this.parameters.learnProbability);
      lastPracticedAt = observation.observedAt;
    }
    if (lastPracticedAt) mastery = this.applyDecay(mastery, (asOf.getTime() - lastPracticedAt.getTime()) / 86_400_000);
    return { topic, mastery: Math.round(clamp(mastery) * 10000) / 100, observations: ordered.length, lastPracticedAt: lastPracticedAt?.toISOString() };
  }

  estimateAll(observations: KnowledgeObservation[], asOf = new Date()): MasteryEstimate[] {
    return [...new Set(observations.map((observation) => observation.topic))].map((topic) => this.estimate(topic, observations, asOf));
  }

  private applyDecay(mastery: number, days: number): number {
    if (days <= 0) return mastery;
    return mastery * 2 ** (-days / this.parameters.forgettingHalfLifeDays);
  }
}