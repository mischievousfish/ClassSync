import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, messaging } from '../config/firebase';
import { retryDelay, withRetry } from '../shared/retry';

export interface AssignmentSyncJob {
  id: string;
  type: 'ASSIGNMENT_SYNC';
  assignmentId: string;
  classId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'DLQ';
  attempts: number;
  availableAt: Timestamp;
  lastError?: string;
}

const jobs = db.collection('syncJobs');
const batchSize = 500;
const retryOptions = { maxAttempts: 5, baseDelayMs: 250, maxDelayMs: 30_000, jitterRatio: 0.25 };

export class NotificationPublisherWorker {
  private timer?: NodeJS.Timeout;

  constructor(private readonly pollIntervalMs = 1_000, private readonly concurrency = 10) {}

  start(): void {
    if (this.timer) return;
    void this.runOnce();
    this.timer = setInterval(() => { void this.runOnce(); }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async runOnce(): Promise<void> {
    const snapshot = await jobs.where('status', '==', 'PENDING').where('availableAt', '<=', Timestamp.now()).limit(this.concurrency).get();
    await Promise.all(snapshot.docs.map(async (document) => {
      try { await processAssignmentSync(document.data() as AssignmentSyncJob); }
      catch (error) { console.error(`Sync job ${document.id} failed and was scheduled for retry`, error); }
    }));
  }
}

export async function enqueueAssignmentSync(assignmentId: string, classId: string): Promise<AssignmentSyncJob> {
  const reference = jobs.doc();
  const job: AssignmentSyncJob = {
    id: reference.id, type: 'ASSIGNMENT_SYNC', assignmentId, classId, status: 'PENDING', attempts: 0,
    availableAt: Timestamp.now(),
  };
  await reference.set(job);
  return job;
}

export async function processAssignmentSync(job: AssignmentSyncJob): Promise<void> {
  const jobReference = jobs.doc(job.id);
  await jobReference.update({ status: 'PROCESSING', attempts: FieldValue.increment(1) });
  try {
    const [assignmentSnapshot, enrollmentSnapshot] = await Promise.all([
      db.collection('assignments').doc(job.assignmentId).get(),
      db.collection('classEnrollments').where('classId', '==', job.classId).get(),
    ]);
    if (!assignmentSnapshot.exists) throw new Error('Assignment not found');
    const assignment = assignmentSnapshot.data() as Record<string, unknown>;
    const studentIds = enrollmentSnapshot.docs
      .filter((document) => !document.data().status || document.data().status === 'ACTIVE')
      .map((document) => document.data().studentId as string);

    for (let offset = 0; offset < studentIds.length; offset += batchSize) {
      const chunk = studentIds.slice(offset, offset + batchSize);
      await withRetry(async () => {
        const batch = db.batch();
        for (const studentId of chunk) {
          batch.set(db.collection('studentSchedules').doc(studentId).collection('items').doc(job.assignmentId), {
            ...assignment, type: 'ASSIGNMENT', syncedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        await batch.commit();
      }, retryOptions);
    }

    const tokens = await getStudentTokens(studentIds);
    for (let offset = 0; offset < tokens.length; offset += batchSize) {
      const tokenChunk = tokens.slice(offset, offset + batchSize);
      if (process.env.FCM_ENABLED === 'false') continue;
      const result = await withRetry(async () => messaging.sendEachForMulticast({
        tokens: tokenChunk,
        notification: {
          title: 'Bài tập mới!',
          body: `${String(assignment.title)} - Hạn nộp: ${toIsoDate(assignment.dueDate)}`,
        },
        data: { eventType: 'ASSIGNMENT_UPSERTED', targetScreen: 'assignment-detail', classId: job.classId, assignmentId: job.assignmentId },
      }), retryOptions);
      await purgeInvalidTokens(tokenChunk, result.responses);
    }
    await jobReference.update({ status: 'COMPLETED', completedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    const attempts = job.attempts + 1;
    if (attempts >= retryOptions.maxAttempts) {
      await jobReference.update({ status: 'DLQ', lastError: error instanceof Error ? error.message : 'Unknown sync error', failedAt: FieldValue.serverTimestamp() });
      return;
    }
    await jobReference.update({ status: 'PENDING', availableAt: Timestamp.fromMillis(Date.now() + retryDelay(attempts, retryOptions)), lastError: error instanceof Error ? error.message : 'Unknown sync error' });
    throw error;
  }
}

async function getStudentTokens(studentIds: string[]): Promise<string[]> {
  const tokenGroups = await Promise.all(studentIds.map(async (studentId) => {
    const snapshot = await db.collection('users').doc(studentId).get();
    return (snapshot.data()?.fcmTokens ?? []) as string[];
  }));
  return [...new Set(tokenGroups.flat())];
}

async function purgeInvalidTokens(tokens: string[], responses: Array<{ success: boolean; error?: { code?: string } }>): Promise<void> {
  const invalidCodes = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);
  await Promise.all(responses.map(async (response, index) => {
    if (response.success || !response.error?.code || !invalidCodes.has(response.error.code)) return;
    const matches = await db.collection('users').where('fcmTokens', 'array-contains', tokens[index]).get();
    await Promise.all(matches.docs.map((user) => user.ref.update({ fcmTokens: FieldValue.arrayRemove(tokens[index]) })));
  }));
}

function toIsoDate(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return new Date(String(value)).toISOString();
}
