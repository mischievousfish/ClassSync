export type ConnectivityState = 'online' | 'offline' | 'poor';

export interface ConnectivitySnapshot {
  online: boolean;
  bandwidthMbps: number;
  latencyMs: number;
  source: 'cloud' | 'device';
}

export interface RouteDecision {
  mode: 'cloud' | 'edge';
  reason: string;
  shouldUseFallback: boolean;
  quality: 'highest' | 'balanced' | 'offline-safe';
}

export class HybridAISyncRouter {
  evaluateConnectivity(latencyMs: number, bandwidthMbps: number): ConnectivityState {
    if (bandwidthMbps > 1 && latencyMs <= 500) {
      return 'online';
    }
    if (bandwidthMbps > 0.2 && latencyMs <= 1200) {
      return 'poor';
    }
    return 'offline';
  }

  routeDecision(latencyMs: number, bandwidthMbps: number): RouteDecision {
    const connectivity = this.evaluateConnectivity(latencyMs, bandwidthMbps);

    if (connectivity === 'online') {
      return {
        mode: 'cloud',
        reason: 'Stable connection detected; route to cloud grade model for maximum quality.',
        shouldUseFallback: false,
        quality: 'highest',
      };
    }

    if (connectivity === 'poor') {
      return {
        mode: 'edge',
        reason: 'Weak network; use on-device OCR and local SLM fallback without interrupting the user flow.',
        shouldUseFallback: true,
        quality: 'balanced',
      };
    }

    return {
      mode: 'edge',
      reason: 'Offline or zero connectivity; run all inference on-device.',
      shouldUseFallback: true,
      quality: 'offline-safe',
    };
  }

  getSnapshot(latencyMs: number, bandwidthMbps: number): ConnectivitySnapshot {
    const state = this.evaluateConnectivity(latencyMs, bandwidthMbps);
    return {
      online: state === 'online',
      bandwidthMbps,
      latencyMs,
      source: state === 'online' ? 'cloud' : 'device',
    };
  }
}
