import { lessonOutlineSchema, quizGenerationSchema } from '../src/shared/validation';
import { sanitizePii } from '../src/shared/piiSanitizer';

describe('AI request validation', () => {
  it('defaults quiz count and difficulty', () => {
    expect(quizGenerationSchema.parse({ topic: 'Fractions', gradeLevel: '7' })).toMatchObject({ numQuestions: 10, difficulty: 'MEDIUM' });
  });

  it('rejects unsafe quiz sizes and empty lesson requests', () => {
    expect(() => quizGenerationSchema.parse({ topic: 'x', gradeLevel: '7', numQuestions: 51 })).toThrow();
    expect(() => lessonOutlineSchema.parse({})).toThrow();
  });

  it('redacts student contact data before AI use', () => {
    const result = sanitizePii('Student Nguyen, email student@example.com, phone +84 912 345 678');
    expect(result.value).not.toContain('student@example.com');
    expect(result.value).not.toContain('+84 912 345 678');
    expect(result.replacements).toBe(2);
  });
});