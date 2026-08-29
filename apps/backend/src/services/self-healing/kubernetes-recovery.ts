export interface WorkloadHealth {
  name: string;
  ready: boolean;
  unhealthy: boolean;
  pendingConnections: number;
}

export interface RecoveryAction {
  workload: string;
  action: 'RESTART' | 'DRAIN_WEBSOCKETS' | 'NONE';
  reason: string;
  at: number;
}

export interface KubernetesRecoveryWorkerOptions {
  workloads?: WorkloadHealth[];
  drainThreshold?: number;
  restartThreshold?: number;
}

export class KubernetesAutoRecoveryWorker {
  private readonly workloads: WorkloadHealth[];
  private readonly drainThreshold: number;
  private readonly restartThreshold: number;

  constructor(options: KubernetesRecoveryWorkerOptions = {}) {
    this.workloads = options.workloads ?? [];
    this.drainThreshold = options.drainThreshold ?? 15;
    this.restartThreshold = options.restartThreshold ?? 10;
  }

  async runOnce(): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    for (const workload of this.workloads) {
      if (workload.unhealthy || !workload.ready) {
        actions.push({
          workload: workload.name,
          action: 'RESTART',
          reason: workload.unhealthy ? 'Workload marked unhealthy by health checks.' : 'Pod not ready.',
          at: Date.now(),
        });
      }

      if (workload.pendingConnections >= this.drainThreshold) {
        actions.push({
          workload: workload.name,
          action: 'DRAIN_WEBSOCKETS',
          reason: `Pending WebSocket connections reached ${workload.pendingConnections}.`,
          at: Date.now(),
        });
      }

      if (workload.pendingConnections >= this.restartThreshold && !workload.ready) {
        actions.push({
          workload: workload.name,
          action: 'RESTART',
          reason: 'Queued work exceeded restart threshold while service remained unhealthy.',
          at: Date.now(),
        });
      }
    }

    return actions;
  }
}
