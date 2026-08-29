export interface LocalizedPromptInput {
  locale: 'vi-VN' | 'en-US' | 'id-ID' | 'th-TH';
  gradeLevel: string;
  subject: string;
  task: string;
}

export class LocalizedPromptBuilder {
  buildTeacherPrompt(input: LocalizedPromptInput): string {
    const toneByLocale: Record<LocalizedPromptInput['locale'], string> = {
      'vi-VN': 'Thầy/Cô hãy đóng vai trò là chuyên gia giáo dục Việt Nam, giữ giọng điệu lịch sự, tôn trọng học sinh và tuân thủ chương trình GDPT. Hãy sử dụng cách nói phù hợp với Thầy/Cô, Em, Dạ/Thưa.',
      'en-US': 'Act as a professional teacher with clear, student-friendly language that matches the local academic standards.',
      'id-ID': 'Bertindaklah sebagai guru yang profesional, komunikatif, dan sesuai dengan kurikulum Indonesia.',
      'th-TH': 'ทำหน้าที่เป็นครูที่มีความเป็นมืออาชีพ มีภาษาและวิธีสอนที่เหมาะสมกับหลักสูตรไทย',
    };

    return `${toneByLocale[input.locale]}\n\nMức lớp: ${input.gradeLevel}\nMôn học: ${input.subject}\nNhiệm vụ: ${input.task}`;
  }

  buildStudentPrompt(input: LocalizedPromptInput): string {
    const toneByLocale: Record<LocalizedPromptInput['locale'], string> = {
      'vi-VN': 'Em là học sinh đang cần sự hỗ trợ rõ ràng, vui vẻ và tôn trọng.',
      'en-US': 'You are a student seeking clear, encouraging guidance.',
      'id-ID': 'Anda adalah siswa yang membutuhkan arahan yang jelas dan mendukung.',
      'th-TH': 'คุณเป็นนักเรียนที่ต้องการคำแนะนำที่ชัดเจนและสร้างแรงบันดาลใจ',
    };

    return `${toneByLocale[input.locale]}\n\nMức lớp: ${input.gradeLevel}\nMôn học: ${input.subject}\nNhiệm vụ: ${input.task}`;
  }
}
