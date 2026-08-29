import { EdgeModelRuntimeBridge } from '../src/services/mobile-edge-ai/edge-model-runtime-bridge';
import { HybridAISyncRouter } from '../src/services/mobile-edge-ai/hybrid-ai-sync-router';
import { QuantizedOCREngine } from '../src/services/mobile-edge-ai/quantized-ocr-engine';

describe('ClassSync mobile edge AI pipeline', () => {
  it('selects the edge runtime for supported high-memory devices', () => {
    const bridge = new EdgeModelRuntimeBridge();
    const result = bridge.runLocalCompletion(
      { totalRamGb: 6, hasNpu: true, architecture: 'arm64-v8a' },
      { modelName: 'phi-3-mini', sizeBytes: 750_000_000, targetTokensPerSecond: 20, format: 'ExecuTorch', quantization: 'Q4_0' },
      'Solve this algebra equation carefully.'
    );

    expect(result.mode).toBe('execuTorch');
    expect(result.usedFallback).toBe(false);
  });

  it('falls back to heuristic mode when RAM is too low for local inference', () => {
    const bridge = new EdgeModelRuntimeBridge();
    const result = bridge.runLocalCompletion(
      { totalRamGb: 2.5, hasNpu: false, architecture: 'armeabi-v7a' },
      { modelName: 'phi-3-mini', sizeBytes: 800_000_000, targetTokensPerSecond: 15, format: 'GGUF', quantization: 'Q4_0' },
      'Explain the derivation process.'
    );

    expect(result.mode).toBe('heuristic');
    expect(result.usedFallback).toBe(true);
  });

  it('routes to cloud when connectivity is healthy and to edge when offline', () => {
    const router = new HybridAISyncRouter();

    expect(router.routeDecision(220, 5).mode).toBe('cloud');
    expect(router.routeDecision(1400, 0.3).mode).toBe('edge');
    expect(router.routeDecision(3000, 0).mode).toBe('edge');
  });

  it('optimizes the OCR model for mobile NPUs and extracts normalized text', () => {
    const engine = new QuantizedOCREngine({
      format: 'TFLite',
      quantization: 'INT8',
      targetDevice: 'arm64-v8a',
      modelSizeBytes: 900_000_000,
    });

    const result = engine.extractText('Question 1\nSolve the equation\n2x + 3 = 9');
    expect(result.quantized).toBe(true);
    expect(result.text).toContain('Question 1');
  });
});
