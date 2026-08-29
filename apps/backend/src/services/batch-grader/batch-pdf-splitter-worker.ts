export interface PDFBatchJob {
  jobId: string;
  sourcePdfUrl: string;
  totalPages: number;
  workerId?: string;
}

export interface SplitPageImage {
  pageNumber: number;
  imageUrl: string;
  extractedAt: string;
}

export class BatchPDFSplitterWorker {
  split(batch: PDFBatchJob): SplitPageImage[] {
    const pages: SplitPageImage[] = [];
    for (let pageNumber = 1; pageNumber <= batch.totalPages; pageNumber += 1) {
      pages.push({
        pageNumber,
        imageUrl: `${batch.sourcePdfUrl.replace(/\.pdf$/i, '')}-page-${pageNumber}.png`,
        extractedAt: new Date().toISOString(),
      });
    }
    return pages;
  }

  queueToRedis(job: PDFBatchJob): { queueName: string; job: PDFBatchJob } {
    return {
      queueName: 'classsync-batch-grader',
      job,
    };
  }
}
