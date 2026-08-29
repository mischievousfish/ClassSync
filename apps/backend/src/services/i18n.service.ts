export type LocaleCode = 'vi-VN' | 'en-US' | 'id-ID' | 'th-TH';

export type TranslationCatalog = Record<string, Record<string, string>>;

export const translationCatalogs: Record<LocaleCode, TranslationCatalog> = {
  'vi-VN': {
    auth: { welcome: 'Chào mừng đến với ClassSync' },
    common: { teacherPolite: 'Thầy/Cô', studentPolite: 'Em', politeReply: 'Dạ/Thưa', gradeLabel: 'Lớp' },
    deadline: { daysLeft: 'Còn {count} ngày nữa đến hạn nộp' },
    curriculum: { grade10: 'Lớp 10', gradeLabel: 'Lớp {grade}' },
    grading: { scale10: '10-point scale', gpa: '4.0 GPA' },
  },
  'en-US': {
    auth: { welcome: 'Welcome to ClassSync' },
    common: { teacherPolite: 'Teacher', studentPolite: 'Student', politeReply: 'Certainly', gradeLabel: 'Grade' },
    deadline: { daysLeft: '{count} days left until submission' },
    curriculum: { grade10: 'Grade 10', gradeLabel: 'Grade {grade}' },
    grading: { scale10: '10-point scale', gpa: '4.0 GPA' },
  },
  'id-ID': {
    common: { teacherPolite: 'Bapak/Ibu Guru', studentPolite: 'Anak', politeReply: 'Baik', gradeLabel: 'Kelas' },
    curriculum: { grade10: 'Kelas 10', gradeLabel: 'Kelas {grade}' },
    grading: { scale10: 'Skala 10', gpa: 'IPK 4.0' },
  },
  'th-TH': {
    auth: { welcome: 'ยินดีต้อนรับสู่ ClassSync' },
    common: { teacherPolite: 'ครู/อาจารย์', studentPolite: 'เด็ก', politeReply: 'ครับ/ค่ะ', gradeLabel: 'ชั้น' },
    deadline: { daysLeft: 'เหลือ {count} วันจนถึงกำหนดส่ง' },
    curriculum: { grade10: 'ชั้นมัธยมศึกษาปีที่ 10', gradeLabel: 'ชั้น {grade}' },
    grading: { scale10: 'เกณฑ์ 10', gpa: 'GPA 4.0' },
  },
};

export class I18nService {
  private readonly fallbackOrder: LocaleCode[] = ['en-US', 'vi-VN'];

  getCatalog(locale: LocaleCode): TranslationCatalog {
    return translationCatalogs[locale] ?? translationCatalogs['en-US'];
  }

  resolveKey(locale: LocaleCode, keyPath: string): string | undefined {
    const localesToCheck = [locale, ...this.fallbackOrder.filter((candidate) => candidate !== locale)];

    for (const currentLocale of localesToCheck) {
      const catalog = this.getCatalog(currentLocale as LocaleCode);
      const tokens = keyPath.split('.');
      let value: unknown = catalog;
      for (const token of tokens) {
        if (!value || typeof value !== 'object' || !(token in value)) {
          value = undefined;
          break;
        }
        value = (value as Record<string, unknown>)[token];
      }
      if (typeof value === 'string') return value;
    }

    return undefined;
  }

  interpolate(template: string, params: Record<string, string | number> = {}): string {
    return Object.entries(params).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, String(value)), template);
  }

  t<T extends string = string>(keyPath: string, locale: LocaleCode, params: Record<string, string | number> = {}): string {
    const raw = this.resolveKey(locale, keyPath) ?? this.resolveKey('en-US', keyPath) ?? this.resolveKey('vi-VN', keyPath) ?? keyPath;
    return this.interpolate(raw, params);
  }

  pluralize(locale: LocaleCode, singularKey: string, pluralKey: string, count: number, params: Record<string, string | number> = {}): string {
    const key = count === 1 ? singularKey : pluralKey;
    const template = this.t(key, locale, { ...params, count });
    return this.interpolate(template, { count, ...params });
  }
}
