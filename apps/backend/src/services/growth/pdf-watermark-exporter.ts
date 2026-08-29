export interface WatermarkedPdfExportInput {
  title: string;
  teacherName: string;
  footerNote?: string;
}

export class PDFWatermarkExporter {
  static export({ title, teacherName, footerNote }: WatermarkedPdfExportInput): { fileName: string; footerBanner: string; contents: string } {
    const banner = `Được soạn tự động trong 30 giây bằng ClassSync AI - Tải app tại classsync.edu.vn`;
    const finalFooter = footerNote ?? banner;

    return {
      fileName: `${title.toLowerCase().replace(/\s+/g, '-')}-classsync-export.pdf`,
      footerBanner: finalFooter,
      contents: `Title: ${title}\nPrepared by: ${teacherName}\nFooter: ${finalFooter}`,
    };
  }
}
