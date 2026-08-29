import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AppError } from '../shared/errors';

export interface ConsentRecord {
  userId: string;
  consentType: string;
  agreedAt: Timestamp;
  ipAddress: string;
  termsVersion: string;
}

function jsonBytes(value: unknown): Buffer { return Buffer.from(JSON.stringify(value, (_key, item) => item instanceof Timestamp ? item.toDate().toISOString() : item, 2)); }

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipJsonFiles(files: Record<string, unknown>): Buffer {
  const local: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const [name, value] of Object.entries(files)) {
    const filename = Buffer.from(name); const raw = jsonBytes(value); const compressed = deflateRawSync(raw); const checksum = crc32(raw);
    const localHeader = Buffer.alloc(30 + filename.length); localHeader.writeUInt32LE(0x04034b50, 0); localHeader.writeUInt16LE(20, 4); localHeader.writeUInt16LE(8, 6); localHeader.writeUInt32LE(checksum, 14); localHeader.writeUInt32LE(compressed.length, 18); localHeader.writeUInt32LE(raw.length, 22); localHeader.writeUInt16LE(filename.length, 26); filename.copy(localHeader, 30); local.push(Buffer.concat([localHeader, compressed]));
    const centralHeader = Buffer.alloc(46 + filename.length); centralHeader.writeUInt32LE(0x02014b50, 0); centralHeader.writeUInt16LE(20, 4); centralHeader.writeUInt16LE(20, 6); centralHeader.writeUInt16LE(8, 8); centralHeader.writeUInt32LE(checksum, 16); centralHeader.writeUInt32LE(compressed.length, 20); centralHeader.writeUInt32LE(raw.length, 24); centralHeader.writeUInt16LE(filename.length, 28); centralHeader.writeUInt32LE(offset, 42); filename.copy(centralHeader, 46); central.push(centralHeader); offset += local[local.length - 1].length;
  }
  const directory = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length ? Object.keys(files).length : 0, 8); end.writeUInt16LE(Object.keys(files).length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

async function queryUser(collection: string, field: string, value: string): Promise<Record<string, unknown>[]> {
  const snapshot = await db.collection(collection).where(field, '==', value).get();
  return snapshot.docs.map((document) => document.data() as Record<string, unknown>);
}

export async function recordConsent(userId: string, input: { consentType: string; termsVersion: string; ipAddress: string }): Promise<ConsentRecord> {
  const consent: ConsentRecord = { userId, consentType: input.consentType, termsVersion: input.termsVersion, ipAddress: input.ipAddress, agreedAt: Timestamp.now() };
  await db.collection('user_consents').add(consent);
  return consent;
}

export async function exportUserData(userId: string): Promise<Buffer> {
  const [user, profiles, consents, submissions, notes, schedules, attendance, bills] = await Promise.all([
    db.collection('users').doc(userId).get(), queryUser('parent_profiles', 'userId', userId), queryUser('user_consents', 'userId', userId), queryUser('assignmentSubmissions', 'studentId', userId), queryUser('studentMicroProfiles', 'studentId', userId), db.collection('studentSchedules').doc(userId).collection('items').get(), queryUser('attendance_records', 'studentId', userId), queryUser('tuition_bills', 'studentId', userId),
  ]);
  return zipJsonFiles({ 'user.json': user.exists ? user.data() : null, 'parent-profiles.json': profiles, 'consents.json': consents, 'homework-submissions.json': submissions, 'micro-profile-notes.json': notes, 'schedules.json': schedules.docs.map((document) => document.data()), 'attendance.json': attendance, 'tuition-bills.json': bills });
}

async function deleteQueryResults(collection: string, field: string, value: string): Promise<void> {
  const snapshot = await db.collection(collection).where(field, '==', value).get();
  for (let offset = 0; offset < snapshot.docs.length; offset += 500) { const batch = db.batch(); snapshot.docs.slice(offset, offset + 500).forEach((document) => batch.delete(document.ref)); await batch.commit(); }
}

export async function eraseUserAccount(userId: string): Promise<void> {
  const userClasses = await db.collection('classes').where('teacherId', '==', userId).get();
  for (const classDocument of userClasses.docs) {
    await deleteQueryResults('assignments', 'classId', classDocument.id);
    await deleteQueryResults('classEnrollments', 'classId', classDocument.id);
    await classDocument.ref.delete();
  }
  await Promise.all([
    deleteQueryResults('parent_profiles', 'userId', userId), deleteQueryResults('user_consents', 'userId', userId), deleteQueryResults('assignmentSubmissions', 'studentId', userId), deleteQueryResults('studentMicroProfiles', 'studentId', userId), deleteQueryResults('attendance_records', 'studentId', userId), deleteQueryResults('tuition_bills', 'studentId', userId), deleteQueryResults('student_diagnostic_notes', 'studentId', userId), deleteQueryResults('organization_memberships', 'userId', userId),
  ]);
  const schedule = await db.collection('studentSchedules').doc(userId).collection('items').get(); const scheduleBatch = db.batch(); schedule.docs.forEach((document) => scheduleBatch.delete(document.ref)); await scheduleBatch.commit();
  await db.collection('users').doc(userId).set({ id: `deleted_${createHash('sha256').update(userId).digest('hex').slice(0, 16)}`, fcmTokens: [], status: 'DELETED', deletedAt: FieldValue.serverTimestamp() }, { merge: true });
  try { await getAuth().deleteUser(userId); } catch (error) { if (!(error as { code?: string }).code?.includes('user-not-found')) throw error; }
}