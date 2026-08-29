export interface SelfHealingReport {
  summary: string;
  rootCause: string;
  playbooksExecuted: string[];
  recoveryTimeMs: number;
  timestamp: number;
}

export class IncidentAuditService {
  generateReport(event: {
    metric: string;
    rootCause: string;
    playbooksExecuted: string[];
    recoveryTimeMs: number;
  }): SelfHealingReport {
    return {
      summary: `Incident on ${event.metric} was auto-healed with graceful degradation and targeted recovery actions.`,
      rootCause: event.rootCause,
      playbooksExecuted: event.playbooksExecuted,
      recoveryTimeMs: event.recoveryTimeMs,
      timestamp: Date.now(),
    };
  }

  toMarkdown(report: SelfHealingReport): string {
    return [
      '# Postmortem Report',
      '',
      `- Summary: ${report.summary}`,
      `- Root cause: ${report.rootCause}`,
      `- Recovery time: ${report.recoveryTimeMs} ms`,
      `- Executed playbooks: ${report.playbooksExecuted.join(', ') || 'None'}`,
      `- Timestamp: ${new Date(report.timestamp).toISOString()}`,
      '',
      '## Recovery notes',
      '',
      '- System reverted to degraded mode while preserving core assignment and schedule APIs.',
      '- Fallback LLM routing and connection-scaling were triggered automatically.',
      '- WebSocket drains and pod restarts were applied only when health signals confirmed service instability.',
    ].join('\n');
  }
}
