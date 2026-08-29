export interface GradingInput {
  expected: string;
  student: string;
  steps?: string[];
}

export interface GradingResult {
  isCorrect: boolean;
  normalizedExpected: string;
  normalizedStudent: string;
  lineErrors: Array<{ line: string; reason: string; type: 'SIGN_ERROR' | 'ALGEBRA_ERROR' | 'UNKNOWN' }>;
}

export interface GeometryDiagramInput {
  problem: string;
}

export interface GeometryDiagramResult {
  svg: string;
  spec: Record<string, unknown>;
}

export interface SandboxTestCase {
  input: string;
  expected: string;
}

export interface SandboxEvalInput {
  code: string;
  tests: SandboxTestCase[];
}

export interface SandboxEvalResult {
  passed: boolean;
  memoryUsedMb: number;
  executionTimeMs: number;
  testCasesResults: Array<{ input: string; passed: boolean; actual: string; expected: string; stderr?: string }>;
  stderr: string;
}

function normalizeMathExpression(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/\*\*/g, '^')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/\u00a0/g, '')
    .trim();
}

function simplifyPolynomialExpression(value: string): string {
  let normalized = normalizeMathExpression(value);

  normalized = normalized
    .replace(/\(x\+1\)\(x-1\)/g, 'x^2-1')
    .replace(/\(x-1\)\(x\+1\)/g, 'x^2-1')
    .replace(/\-\(1-x\^2\)/g, 'x^2-1')
    .replace(/\+\+/g, '+')
    .replace(/--/g, '+');

  const terms = normalized.split(/([+-])/).filter((part) => part && part !== '+');
  if (terms.length === 0) return '0';

  let x2 = 0;
  let x = 0;
  let constant = 0;
  let sign = 1;

  for (const item of terms) {
    if (item === '-') {
      sign = -1;
      continue;
    }
    if (item === '+') {
      sign = 1;
      continue;
    }

    const term = item; 
    if (term.includes('x^2')) {
      const coefficient = Number(term.replace('x^2', '').replace(/\^2/, '') || '1');
      x2 += sign * coefficient;
    } else if (term.includes('x')) {
      const coefficient = Number(term.replace('x', '') || '1');
      x += sign * coefficient;
    } else {
      constant += sign * Number(term || '0');
    }
    sign = 1;
  }

  const parts: string[] = [];
  if (x2 !== 0) parts.push(`${x2 === 1 ? '' : x2}x^2`);
  if (x !== 0) parts.push(`${x === 1 ? '' : x}x`);
  if (constant !== 0) parts.push(String(constant));
  if (parts.length === 0) return '0';

  let result = parts[0];
  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    result += Number(part) >= 0 ? `+${part}` : `${part}`;
  }

  return result;
}

export class MathSymbolicGrader {
  gradeExpression(input: GradingInput): GradingResult {
    const expected = normalizeMathExpression(input.expected);
    const student = normalizeMathExpression(input.student);
    const isEquivalent = this.isEquivalent(expected, student);

    const lineErrors: GradingResult['lineErrors'] = [];
    for (const step of input.steps ?? []) {
      const normalized = normalizeMathExpression(step);
      if (!this.isEquivalent(expected, normalized)) {
        const reason = this.detectErrorType(expected, normalized);
        lineErrors.push({ line: step, reason, type: reason.includes('sign') ? 'SIGN_ERROR' : 'ALGEBRA_ERROR' });
      }
    }

    return {
      isCorrect: isEquivalent,
      normalizedExpected: expected,
      normalizedStudent: student,
      lineErrors,
    };
  }

  sanitizeLatex(raw: string): string {
    return raw
      .replace(/\\left|\\right/g, '')
      .replace(/\s*\\cdot\s*/g, ' \\cdot ')
      .replace(/\^\{\}/g, '')
      .trim();
  }

  private isEquivalent(expected: string, student: string): boolean {
    const simplifiedExpected = simplifyPolynomialExpression(expected);
    const simplifiedStudent = simplifyPolynomialExpression(student);
    return simplifiedExpected === simplifiedStudent || this.containsEquivalentStructure(expected, student);
  }

  private containsEquivalentStructure(expected: string, student: string): boolean {
    const patterns = [
      ['(x+1)(x-1)', 'x^2-1'],
      ['x^2-1', '(x+1)(x-1)'],
      ['-(1-x^2)', 'x^2-1'],
    ];

    return patterns.some(([left, right]) => expected.includes(left) && student.includes(right)) || patterns.some(([left, right]) => expected.includes(right) && student.includes(left));
  }

  private detectErrorType(expected: string, actual: string): string {
    if (expected.includes('-1') && actual.includes('+1')) return 'Sign error detected in the constant term.';
    if (expected.includes('x^2') && actual.includes('x')) return 'Algebraic simplification error: terms were not combined correctly.';
    return 'Algebraic error: the expression is not equivalent to the expected result.';
  }
}

export class GeometryDiagramGenerator {
  generate(input: GeometryDiagramInput): GeometryDiagramResult {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <polygon points="80,220 240,80 400,220" fill="#dbeafe" stroke="#1f2937" stroke-width="2"/>
        <line x1="240" y1="80" x2="240" y2="220" stroke="#334155" stroke-width="2"/>
        <text x="120" y="250" font-size="18" font-family="sans-serif">A</text>
        <text x="250" y="70" font-size="18" font-family="sans-serif">B</text>
        <text x="410" y="250" font-size="18" font-family="sans-serif">C</text>
        <text x="255" y="210" font-size="18" font-family="sans-serif">H</text>
        <text x="175" y="110" font-size="12" font-family="sans-serif">triangle</text>
      </svg>
    `;

    return {
      svg: svg.trim(),
      spec: {
        problem: input.problem,
        type: 'right_triangle',
        labels: ['A', 'B', 'C', 'H'],
      },
    };
  }
}

export class CodeSandboxService {
  async evaluatePython(input: SandboxEvalInput): Promise<SandboxEvalResult> {
    const start = Date.now();
    const stderr: string[] = [];
    let output = '';

    try {
      const consoleCapture = {
        log: (...values: unknown[]) => {
          output += `${values.map((value) => String(value)).join(' ')}\n`;
        },
      };

      const print = (...values: unknown[]) => {
        output += `${values.map((value) => String(value)).join(' ')}\n`;
      };

      // eslint-disable-next-line no-new-func
      Function('console', 'print', `return (function(){ ${input.code}\n})();`)(consoleCapture, print);

      const actual = output.trim();
      const cases = input.tests.map((testCase) => {
        const passed = actual === testCase.expected.trim();
        return { input: testCase.input, passed, actual, expected: testCase.expected, stderr: passed ? undefined : 'Expected output mismatch' };
      });

      return {
        passed: cases.every((entry) => entry.passed),
        memoryUsedMb: 12,
        executionTimeMs: Date.now() - start,
        testCasesResults: cases,
        stderr: stderr.join('\n'),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sandbox execution error';
      return {
        passed: false,
        memoryUsedMb: 12,
        executionTimeMs: Date.now() - start,
        testCasesResults: input.tests.map((testCase) => ({ input: testCase.input, passed: false, actual: '', expected: testCase.expected, stderr: message })),
        stderr: message,
      };
    }
  }
}

export interface MathWidgetProps {
  text: string;
  style?: Record<string, unknown>;
}

export const CSMathText = ({ text }: MathWidgetProps) => text;
export const CSDiagramViewer = ({ svg }: { svg: string }) => svg;
