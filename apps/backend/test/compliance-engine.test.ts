import { VerifiableParentalConsentEngine } from '../src/services/compliance/verifiable-parental-consent.engine';
import { ImmutableAuditLogger } from '../src/services/compliance/immutable-audit-logger';
import { DataRetentionSweeperWorker } from '../src/services/compliance/data-retention-sweeper.worker';
import { buildComplianceDashboardReport, buildDpiaReport, buildPrivacyExportPackage } from '../src/controllers/compliance.controller';

describe('ClassSync Trust & Privacy Engine', () => {
  it('blocks underage onboarding until parental consent is verified', () => {
    const engine = new VerifiableParentalConsentEngine();
    const result = engine.evaluateAgeGate({
      studentId: 'student-1',
      dateOfBirth: '2015-02-01',
      country: 'US',
      isStudentRecordComplete: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.requiredConsent).toBe(true);
    expect(result.parentInvitationSent).toBe(true);
  });

  it('creates a tamper-evident hash chain for audit events', () => {
    const logger = new ImmutableAuditLogger();
    const first = logger.logEvent({
      actorUserId: 'teacher-1',
      actorRole: 'TEACHER',
      actionType: 'VIEW_STUDENT_NOTE',
      targetResourceId: 'note-42',
      clientIp: '203.0.113.10',
      userAgent: 'Chrome/123',
    });

    const second = logger.logEvent({
      actorUserId: 'admin-1',
      actorRole: 'ORG_ADMIN',
      actionType: 'EXPORT_GRADES',
      targetResourceId: 'report-77',
      clientIp: '203.0.113.11',
      userAgent: 'Browser/1',
    });

    expect(first.previousHash).toBe('GENESIS');
    expect(second.previousHash).toBe(first.currentHash);
    expect(logger.verifyChain()).toBe(true);
  });

  it('anonymizes stale accounts and scrubs third-party analytics exports', () => {
    const worker = new DataRetentionSweeperWorker();
    const result = worker.runSweep({
      inactiveStudentAccounts: [
        { id: 's1', lastActiveAt: '2024-06-01T00:00:00.000Z', age: 15 },
      ],
      chatLogs: [{ id: 'chat-1', userId: 's1', content: 'hello', updatedAt: '2024-06-01T00:00:00.000Z' }],
      rawOcrImages: [{ id: 'ocr-1', ownerId: 's1', createdAt: '2024-06-01T00:00:00.000Z' }],
      analyticsRows: [{ studentId: 's1', name: 'Ava', score: 95 }],
    });

    expect(result.anonymizedAccounts).toHaveLength(1);
    expect(result.redactedAnalyticsRows[0].name).toBe('[REDACTED]');
  });

  it('produces a DPIA and compliance export package', () => {
    const report = buildDpiaReport({
      projectName: 'ClassSync Student Insights',
      dataCategories: ['STUDENT_PROFILE', 'BEHAVIORAL_MICROPROFILE', 'ASSESSMENT_DATA'],
      lawfulBasis: ['CONSENT', 'EDUCATIONAL_LEGITIMATE_INTEREST'],
      highRisk: true,
    });

    const exportPackage = buildPrivacyExportPackage({
      jurisdiction: 'GDPR',
      generatedBy: 'compliance-admin',
      studentCount: 1200,
    });

    const dashboard = buildComplianceDashboardReport({
      jurisdictions: ['COPPA', 'FERPA', 'GDPR', 'PDPD'],
      totalAlerts: 1,
      complianceRate: 98,
    });

    expect(report.highRisk).toBe(true);
    expect(exportPackage.packageType).toBe('GDPR');
    expect(dashboard.jurisdictions).toHaveLength(4);
  });
});
