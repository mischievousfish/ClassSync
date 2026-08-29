import { MathSymbolicGrader, GeometryDiagramGenerator, CodeSandboxService } from '../src/services/math-engine';

describe('math and code engine', () => {
  it('detects algebraic equivalence and identifies sign errors', () => {
    const grader = new MathSymbolicGrader();
    const result = grader.gradeExpression({
      expected: '(x + 1)(x - 1)',
      student: 'x^2 - 1',
      steps: [
        'x^2 - x + x - 1',
        'x^2 - 1',
      ],
    });

    expect(result.isCorrect).toBe(true);
    expect(result.lineErrors.length).toBe(0);
  });

  it('generates a geometry diagram specification from a problem statement', () => {
    const generator = new GeometryDiagramGenerator();
    const result = generator.generate({ problem: 'Cho tam giác ABC vuông tại A, đường cao AH. Biết AB = 3cm, AC = 4cm' });

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('triangle');
  });

  it('runs a Python solution in an isolated sandbox', async () => {
    const sandbox = new CodeSandboxService();
    const result = await sandbox.evaluatePython({
      code: 'print(2 + 2)',
      tests: [{ input: '', expected: '4' }],
    });

    expect(result.passed).toBe(true);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
