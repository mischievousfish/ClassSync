import { SelfHealingTelemetryDaemon } from '../src/services/self-healing/telemetry';
import { CircuitBreakerFallbackManager } from '../src/services/self-healing/circuit-breaker';
import { GracefulDegradationController } from '../src/services/self-healing/graceful-degradation';
import { KubernetesAutoRecoveryWorker } from '../src/services/self-healing/kubernetes-recovery';

describe('ClassSync resilience engine', () => {
  it('detects anomalous telemetry spikes before failure', () => {
    const daemon = new SelfHealingTelemetryDaemon({ windowSize: 12, zScoreThreshold: 2.5 });

    for (let i = 0; i < 10; i += 1) {
      daemon.record('db_read_latency_ms', 120 + i * 2);
    }
    daemon.record('db_read_latency_ms', 820);

    const anomaly = daemon.detectAnomaly('db_read_latency_ms');
    expect(anomaly).not.toBeNull();
    expect(anomaly?.metric).toBe('db_read_latency_ms');
  });

  it('switches to a fallback provider after repeated rate-limited calls', async () => {
    const manager = new CircuitBreakerFallbackManager({
      providers: ['gemini-primary', 'claude-fallback'],
      fallbackProvider: 'claude-fallback',
      consecutiveFailureThreshold: 2,
      fallbackDelayMs: 500,
    });

    manager.recordFailure('gemini-primary', 429);
    manager.recordFailure('gemini-primary', 503);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(manager.getActiveProvider()).toBe('claude-fallback');
  });

  it('enables graceful degradation during severe load', () => {
    const controller = new GracefulDegradationController();
    const state = controller.evaluate({
      errorRate: 0.16,
      latencyP99: 2400,
      cpuUsage: 0.94,
      memoryUsage: 0.89,
      redisMemoryUsage: 0.92,
    });

    expect(state.mode).toBe('DEGRADED');
    expect(state.disabledFeatures).toContain('leaderboard');
  });

  it('restarts unhealthy workloads and drains websocket connections', async () => {
    const worker = new KubernetesAutoRecoveryWorker({
      workloads: [
        { name: 'api-gateway', ready: false, unhealthy: true, pendingConnections: 18 },
        { name: 'websocket-broker', ready: true, unhealthy: false, pendingConnections: 2 },
      ],
    });

    const actions = await worker.runOnce();
    expect(actions.some((action) => action.action === 'RESTART')).toBe(true);
    expect(actions.some((action) => action.action === 'DRAIN_WEBSOCKETS')).toBe(true);
  });
});
