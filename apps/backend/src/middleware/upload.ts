import multer from 'multer';

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.OCR_MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024, files: 1 },
});
