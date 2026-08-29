import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, messaging } from '../config/firebase';
import { AttendanceRecord, TuitionBill } from '../models';
import { AppError } from '../shared/errors';
import { ParentNotificationService } from './parent-notification.service';

function cycleBounds(cycle: string): { start: string; end: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(cycle)) throw new AppError(400, 'billingCycle must use YYYY-MM format');
  const [year, month] = cycle.split('-').map(Number);
  return { start: `${cycle}-01`, end: `${year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01` };
}

export async function generateMonthlyBills(orgId: string, billingCycle: string): Promise<{ created: number; bills: TuitionBill[] }> {
  const bounds = cycleBounds(billingCycle);
  const classSnapshot = await db.collection('classes').where('orgId', '==', orgId).get();
  const bills: TuitionBill[] = [];
  for (const classDocument of classSnapshot.docs) {
    const classData = classDocument.data();
    const ratePerSession = Number(classData.ratePerSession ?? classData.monthlyRate ?? 0);
    if (!ratePerSession) continue;
    const [enrollmentSnapshot, attendanceSnapshot] = await Promise.all([
      db.collection('classEnrollments').where('classId', '==', classDocument.id).where('status', '==', 'ACTIVE').get(),
      db.collection('attendance_records').where('classId', '==', classDocument.id).where('sessionDate', '>=', bounds.start).where('sessionDate', '<', bounds.end).get(),
    ]);
    const attendance = attendanceSnapshot.docs.map((document) => document.data() as AttendanceRecord);
    const batch = db.batch();
    for (const enrollment of enrollmentSnapshot.docs) {
      const studentId = enrollment.data().studentId as string;
      const attendedSessions = attendance.filter((record) => record.studentId === studentId && ['PRESENT', 'LATE'].includes(record.status)).length;
      const billReference = db.collection('tuition_bills').doc(`${orgId}_${classDocument.id}_${studentId}_${billingCycle}`);
      const bill: TuitionBill = { id: billReference.id, orgId, teacherId: classData.teacherId, studentId, classId: classDocument.id, billingCycle, amountDue: attendedSessions * ratePerSession, discountAmount: 0, status: 'UNPAID', dueDate: Timestamp.fromDate(new Date(`${bounds.end}T00:00:00.000Z`)), createdAt: FieldValue.serverTimestamp() as never };
      batch.set(billReference, bill, { merge: true });
      bills.push(bill);
    }
    await batch.commit();
  }
  return { created: bills.length, bills };
}

export async function receivePayment(input: { billId: string; transactionRef: string; amount: number; paymentMethod?: TuitionBill['paymentMethod'] }) {
  const reference = db.collection('tuition_bills').doc(input.billId);
  const bill = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new AppError(404, 'Tuition bill was not found');
    const current = snapshot.data() as TuitionBill;
    if (input.amount < current.amountDue - current.discountAmount) throw new AppError(400, 'Payment amount is below the bill total');
    transaction.update(reference, { status: 'PAID', amountPaid: input.amount, paymentMethod: input.paymentMethod ?? 'BANK_TRANSFER', transactionRef: input.transactionRef, paidAt: FieldValue.serverTimestamp() });
    return current;
  });
  await new ParentNotificationService().send({ orgId: bill.orgId, studentId: bill.studentId, eventType: 'MONTHLY_TUITION_BILL', templateId: process.env.ZALO_TUITION_TEMPLATE_ID ?? 'tuition-paid', templateData: { amount: String(input.amount), status: 'PAID' }, title: 'Thanh toán học phí thành công', body: `Học phí tháng ${bill.billingCycle} đã được ghi nhận.` });
  if (bill.teacherId) {
    const teacher = await db.collection('users').doc(bill.teacherId).get();
    const tokens = (teacher.data()?.fcmTokens ?? []) as string[];
    if (tokens.length) await messaging.sendEachForMulticast({ tokens, notification: { title: 'Đã nhận học phí', body: `Học sinh ${bill.studentId} đã thanh toán tháng ${bill.billingCycle}.` }, data: { eventType: 'TUITION_PAID', billId: bill.id } });
  }
  return { ...bill, status: 'PAID', transactionRef: input.transactionRef };
}

export async function getParentDashboard(parentUserId: string, studentId: string) {
  const parent = await db.collection('parent_profiles').where('userId', '==', parentUserId).where('studentIds', 'array-contains', studentId).limit(1).get();
  if (parent.empty) throw new AppError(403, 'Parent is not linked to this student');
  const [attendance, submissions, notes, bills] = await Promise.all([
    db.collection('attendance_records').where('studentId', '==', studentId).get(),
    db.collection('assignmentSubmissions').where('studentId', '==', studentId).orderBy('submittedAt', 'desc').limit(20).get(),
    db.collection('studentMicroProfiles').where('studentId', '==', studentId).where('approvedForParent', '==', true).orderBy('updatedAt', 'desc').limit(20).get(),
    db.collection('tuition_bills').where('studentId', '==', studentId).where('status', 'in', ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID']).get(),
  ]);
  const records = attendance.docs.map((document) => document.data() as AttendanceRecord);
  const attended = records.filter((record) => ['PRESENT', 'LATE'].includes(record.status)).length;
  return { studentId, attendance: { attendedSessions: attended, totalSessions: records.length, rate: records.length ? attended / records.length : 0 }, homeworkTimeline: submissions.docs.map((document) => document.data()), teacherNotes: notes.docs.map((document) => document.data()), pendingTuition: bills.docs.map((document) => document.data()) };
}