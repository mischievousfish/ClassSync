import { NextFunction, Request, Response } from 'express';
import { IncidentAuditService } from '../services/self-healing/incident-audit';

export class SelfHealingIncidentController {
  private readonly audit = new IncidentAuditService();

  getPostMortem(request: Request, response: Response, next: NextFunction): void {
    try {
      const { metric, rootCause, playbooksExecuted, recoveryTimeMs } = request.query as {
        metric?: string;
        rootCause?: string;
        playbooksExecuted?: string;
        recoveryTimeMs?: string;
      };

      const report = this.audit.generateReport({
        metric: metric ?? 'unknown_metric',
        rootCause: rootCause ?? 'Unknown root cause; no clear dominant signal.',
        playbooksExecuted: (playbooksExecuted ?? 'circuit_breaker;graceful_degradation').split(';').filter(Boolean),
        recoveryTimeMs: Number(recoveryTimeMs ?? 1200),
      });

      response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      response.status(200).send(this.audit.toMarkdown(report));
    } catch (error) {
      next(error);
    }
  }
}
