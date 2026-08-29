export interface InactiveStudentAccount {
  id: string;
  lastActiveAt: string;
  age: number;
}

export interface ChatLogRecord {
  id: string;
  userId: string;
  content: string;
  updatedAt: string;
}

export interface RawOcrImageRecord {
  id: string;
  ownerId: string;
  createdAt: string;
}

export interface AnalyticsRow {
  studentId: string;
  name: string;
  score: number;
}

export interface SweepResult {
  anonymizedAccounts: string[];
  deletedChatLogIds: string[];
  deletedOcrImageIds: string[];
  redactedAnalyticsRows: AnalyticsRow[];
}

export class DataRetentionSweeperWorker {
  runSweep(input: {
    inactiveStudentAccounts: InactiveStudentAccount[];
    chatLogs: ChatLogRecord[];
    rawOcrImages: RawOcrImageRecord[];
    analyticsRows: AnalyticsRow[];
  }): SweepResult {
    const inactiveCutoff = Date.now() - 1000 * 60 * 60 * 24 * 365 * 1;
    const anonymizedAccounts = input.inactiveStudentAccounts
      .filter((student) => new Date(student.lastActiveAt).getTime() < inactiveCutoff)
      .map((student) => student.id);

    const deletedChatLogIds = input.chatLogs
      .filter((chatLog) => anonymizedAccounts.includes(chatLog.userId) || new Date(chatLog.updatedAt).getTime() < inactiveCutoff)
      .map((chatLog) => chatLog.id);

    const deletedOcrImageIds = input.rawOcrImages
      .filter((image) => anonymizedAccounts.includes(image.ownerId) || new Date(image.createdAt).getTime() < inactiveCutoff)
      .map((image) => image.id);

    const redactedAnalyticsRows = input.analyticsRows.map((row) => ({
      ...row,
      studentId: anonymizedAccounts.includes(row.studentId) ? 'ANONYMIZED' : row.studentId,
      name: anonymizedAccounts.includes(row.studentId) ? '[REDACTED]' : row.name,
    }));

    return {
      anonymizedAccounts,
      deletedChatLogIds,
      deletedOcrImageIds,
      redactedAnalyticsRows,
    };
  }
}
