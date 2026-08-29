export type GradeScale = 'vi-VN' | 'en-US' | 'id-ID' | 'th-TH';

export class RegionalEducationalAdapter {
  vietnamToGpa(score10: number): number {
    if (score10 >= 9.0) return 4.0;
    if (score10 >= 8.5) return 3.4;
    if (score10 >= 8.0) return 3.1;
    if (score10 >= 7.5) return 2.9;
    if (score10 >= 7.0) return 2.6;
    if (score10 >= 6.5) return 2.3;
    if (score10 >= 6.0) return 2.0;
    if (score10 >= 5.5) return 1.8;
    if (score10 >= 5.0) return 1.5;
    if (score10 >= 4.0) return 1.0;
    return 0.0;
  }

  convertGrade(score: string, fromScale: GradeScale, toScale: GradeScale): string {
    const numeric = Number(score);
    const vnScore = fromScale === 'vi-VN' ? numeric : this.letterToVietnamScore(score);
    if (toScale === 'en-US') {
      if (vnScore >= 9.5) return 'A+';
      if (vnScore >= 9.0) return 'A';
      if (vnScore >= 8.0) return 'B+';
      if (vnScore >= 7.0) return 'B';
      if (vnScore >= 5.5) return 'C';
      if (vnScore >= 4.0) return 'D';
      return 'F';
    }

    if (toScale === 'vi-VN') return String(numeric);
    return String(this.vietnamToGpa(vnScore));
  }

  private letterToVietnamScore(score: string): number {
    const normalized = score.toUpperCase();
    if (normalized === 'A+') return 9.5;
    if (normalized === 'A') return 8.7;
    if (normalized === 'B+') return 7.8;
    if (normalized === 'B') return 7.0;
    if (normalized === 'C') return 6.0;
    if (normalized === 'D') return 5.0;
    return 0;
  }

  mapGradeLabel(gradeLabel: string, locale: GradeScale): string {
    const normalized = gradeLabel.toLowerCase();
    const localeMap: Record<GradeScale, Record<string, string>> = {
      'vi-VN': { 'lớp 10': 'Lớp 10', 'grade 10': 'Lớp 10', 'kelas 10': 'Lớp 10', '10': 'Lớp 10' },
      'en-US': { 'lớp 10': 'Grade 10', 'kelas 10': 'Grade 10', 'grade 10': 'Grade 10', '10': 'Grade 10' },
      'id-ID': { 'lớp 10': 'Kelas 10', 'grade 10': 'Kelas 10', 'kelas 10': 'Kelas 10', '10': 'Kelas 10' },
      'th-TH': { 'lớp 10': 'ชั้นมัธยมศึกษาปีที่ 10', 'grade 10': 'ชั้นมัธยมศึกษาปีที่ 10', 'kelas 10': 'ชั้นมัธยมศึกษาปีที่ 10', '10': 'ชั้นมัธยมศึกษาปีที่ 10' },
    };

    const result = localeMap[locale][normalized] ?? gradeLabel;
    return result;
  }
}
