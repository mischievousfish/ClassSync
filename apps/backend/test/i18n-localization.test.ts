import { I18nService } from '../src/services/i18n.service';
import { LocalizedPromptBuilder } from '../src/services/localized-prompt-builder';
import { RegionalEducationalAdapter } from '../src/services/regional-educational-adapter';

describe('i18n and regional educational adapter', () => {
  it('falls back to english and then vietnamese when locale keys are missing', () => {
    const service = new I18nService();

    expect(service.t('auth.welcome', 'id-ID')).toBe('Welcome to ClassSync');
    expect(service.t('deadline.daysLeft', 'id-ID', { count: 3 })).toBe('3 days left until submission');
    expect(service.t('common.teacherPolite', 'vi-VN')).toBe('Thầy/Cô');
  });

  it('supports pluralization and parameter interpolation in vietnamese', () => {
    const service = new I18nService();

    expect(service.t('deadline.daysLeft', 'vi-VN', { count: 0 })).toBe('Còn 0 ngày nữa đến hạn nộp');
    expect(service.t('deadline.daysLeft', 'vi-VN', { count: 1 })).toBe('Còn 1 ngày nữa đến hạn nộp');
  });

  it('converts grades across regional systems', () => {
    const adapter = new RegionalEducationalAdapter();

    expect(adapter.vietnamToGpa(8.5)).toBeCloseTo(3.4, 1);
    expect(adapter.convertGrade('8.5', 'vi-VN', 'en-US')).toBe('B+');
    expect(adapter.mapGradeLabel('Lớp 10', 'en-US')).toBe('Grade 10');
  });

  it('builds localized AI prompts with local pedagogical tone', () => {
    const builder = new LocalizedPromptBuilder();

    const prompt = builder.buildTeacherPrompt({
      locale: 'vi-VN',
      gradeLevel: 'Lớp 10',
      subject: 'Toán',
      task: 'Tạo đề kiểm tra 20 câu',
    });

    expect(prompt).toContain('Thầy/Cô');
    expect(prompt).toContain('Lớp 10');
    expect(prompt).toContain('Toán');
  });
});
