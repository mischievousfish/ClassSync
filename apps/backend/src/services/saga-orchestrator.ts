export type SagaStepStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'COMPENSATED';

export interface SagaStep {
  name: string;
  action: () => Promise<void>;
  compensation?: () => Promise<void>;
}

export interface SagaExecutionResult {
  status: 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  steps: Array<{ name: string; status: SagaStepStatus }>;
}

export class SagaOrchestrator {
  async execute(steps: SagaStep[]): Promise<SagaExecutionResult> {
    const execution: Array<{ name: string; status: SagaStepStatus }> = [];

    for (const step of steps) {
      try {
        await step.action();
        execution.push({ name: step.name, status: 'SUCCESS' });
      } catch (error) {
        execution.push({ name: step.name, status: 'FAILED' });

        for (const previous of [...execution].reverse()) {
          const compensationStep = steps.find((candidate) => candidate.name === previous.name && candidate.compensation);
          if (compensationStep?.compensation) {
            try {
              await compensationStep.compensation();
              previous.status = 'COMPENSATED';
            } catch (_compensationError) {
              previous.status = 'FAILED';
            }
          }
        }

        return { status: 'COMPENSATED', steps: execution };
      }
    }

    return { status: 'COMPLETED', steps: execution };
  }
}
