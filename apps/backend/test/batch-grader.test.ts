import { OMRFormAligner } from '../src/services/batch-grader/omr-form-aligner';
import { BubbleDensityEvaluator } from '../src/services/batch-grader/bubble-density-evaluator';
import { BatchPDFSplitterWorker } from '../src/services/batch-grader/batch-pdf-splitter-worker';
import { SpeedGraderController } from '../src/controllers/speed-grader.controller';

describe('ClassSync Rapid Grader', () => {
  it('aligns OMR sheets using fiducial registration marks', () => {
    const aligner = new OMRFormAligner();
    const result = aligner.align({
      fiducials: [
        { x: 40, y: 30 },
        { x: 320, y: 25 },
        { x: 35, y: 260 },
        { x: 315, y: 270 },
      ],
      width: 340,
      height: 280,
      skewDegrees: 4,
    });

    expect(result.transformApplied).toBe(true);
    expect(result.rotationDegrees).toBeGreaterThanOrEqual(-90);
    expect(result.alignedWidth).toBeGreaterThan(0);
  });

  it('classifies bubble density into filled, empty, or erased multiple marks', () => {
    const evaluator = new BubbleDensityEvaluator();
    const statuses = [
      evaluator.evaluate({ x: 0, y: 0, blackPixels: 70, totalPixels: 100 }),
      evaluator.evaluate({ x: 0, y: 0, blackPixels: 5, totalPixels: 100 }),
      evaluator.evaluate({ x: 0, y: 0, blackPixels: 35, totalPixels: 100 }),
    ];

    expect(statuses[0].status).toBe('FILLED');
    expect(statuses[1].status).toBe('EMPTY');
    expect(statuses[2].status).toBe('ERASED_MULTIPLE_MARKS');
  });

  it('splits a multi-page PDF batch into individual page images for worker distribution', () => {
    const worker = new BatchPDFSplitterWorker();
    const pages = worker.split({ jobId: 'job-1', sourcePdfUrl: 'https://files.example.com/exam.pdf', totalPages: 4 });

    expect(pages).toHaveLength(4);
    expect(pages[0].imageUrl).toContain('page-1');
  });

  it('marks low-confidence auto-graded papers for teacher review quickly', () => {
    const controller = new SpeedGraderController();
    const papers = controller.evaluateFastTrack([
      { paperId: 'p1', autoScore: 93, confidence: 0.91, needsManualReview: false, notes: ['Bright path'] },
      { paperId: 'p2', autoScore: 71, confidence: 0.63, needsManualReview: false, notes: [] },
    ]);

    expect(papers[1].needsManualReview).toBe(true);
  });
});
