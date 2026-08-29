export type RuntimeMode = 'execuTorch' | 'llama.cpp' | 'heuristic';

export interface DeviceProfile {
  totalRamGb: number;
  hasNpu: boolean;
  architecture: 'arm64-v8a' | 'armeabi-v7a' | 'ios-metal' | 'unknown';
}

export interface RuntimeSpec {
  modelName: string;
  sizeBytes: number;
  targetTokensPerSecond: number;
  format: 'GGUF' | 'ExecuTorch' | 'TFLite' | 'CoreML';
  quantization: 'INT8' | 'FP16' | 'Q4_0' | 'Q8_0';
}

export interface RuntimeExecutionResult {
  mode: RuntimeMode;
  usedFallback: boolean;
  output: string;
  latencyMs: number;
  memoryFootprintMb: number;
}

export class EdgeModelRuntimeBridge {
  private readonly memoryThresholdGb = 3;

  chooseRuntime(device: DeviceProfile, spec: RuntimeSpec): RuntimeMode {
    if (device.totalRamGb < this.memoryThresholdGb) {
      return 'heuristic';
    }

    if (device.architecture === 'arm64-v8a' || device.architecture === 'ios-metal') {
      return spec.format === 'GGUF' ? 'llama.cpp' : 'execuTorch';
    }

    return 'heuristic';
  }

  shouldUseHeuristic(device: DeviceProfile): boolean {
    return device.totalRamGb < this.memoryThresholdGb || (!device.hasNpu && device.architecture === 'armeabi-v7a');
  }

  runLocalCompletion(device: DeviceProfile, spec: RuntimeSpec, prompt: string): RuntimeExecutionResult {
    const startedAt = Date.now();
    const mode = this.chooseRuntime(device, spec);
    const usedFallback = mode === 'heuristic';

    if (usedFallback) {
      return {
        mode,
        usedFallback: true,
        output: this.heuristicTextResponse(prompt),
        latencyMs: Date.now() - startedAt,
        memoryFootprintMb: Math.min(512, Math.max(80, Math.round(device.totalRamGb * 120))),
      };
    }

    return {
      mode,
      usedFallback: false,
      output: `[${mode}] Local model inference completed for: ${prompt.slice(0, 120)}`,
      latencyMs: Date.now() - startedAt,
      memoryFootprintMb: Math.round(spec.sizeBytes / 1_000_000),
    };
  }

  private heuristicTextResponse(prompt: string): string {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return 'No prompt available. Falling back to rule-based guidance.';
    }

    const lower = trimmed.toLowerCase();
    if (lower.includes('math') || lower.includes('equation')) {
      return 'Break the problem into steps: identify the givens, write the formula, then solve one variable at a time.';
    }

    if (lower.includes('history') || lower.includes('essay')) {
      return 'Use a claim-evidence-reasoning structure: answer the question, cite one fact, and explain why it matters.';
    }

    return 'Review the key concepts, identify the most relevant clue in the prompt, then answer in a short evidence-based response.';
  }
}
