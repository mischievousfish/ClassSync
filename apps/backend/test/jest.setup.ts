process.env.API_PREFIX = '/api/v1';
process.env.OCR_MAX_FILE_SIZE_MB = '10';

afterEach(() => {
  jest.restoreAllMocks();
});