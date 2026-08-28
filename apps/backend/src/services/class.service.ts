import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { Class, ClassEnrollment, ScheduleInfo } from '../models';
import { AppError } from '../shared/errors';

const classes = db.collection('classes');
const enrollments = db.collection('classEnrollments');

function createClassCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createClass(teacherId: string, data: { className: string; subject: string; scheduleInfo: ScheduleInfo[] }): Promise<Class> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const classCode = createClassCode();
    const existing = await classes.where('classCode', '==', classCode).limit(1).get();
    if (!existing.empty) continue;
    const reference = classes.doc();
    const model: Class = { id: reference.id, teacherId, classCode, ...data };
    await reference.set(model);
    return model;
  }
  throw new AppError(503, 'Could not generate a unique class code');
}

export async function joinClass(studentId: string, classCode: string): Promise<ClassEnrollment> {
  const classSnapshot = await classes.where('classCode', '==', classCode).limit(1).get();
  if (classSnapshot.empty) throw new AppError(404, 'Class code was not found');
  const classId = classSnapshot.docs[0].id;
  const enrollmentId = `${classId}_${studentId}`;
  const enrollmentReference = enrollments.doc(enrollmentId);
  const existing = await enrollmentReference.get();
  if (existing.exists) throw new AppError(409, 'Student is already enrolled in this class');
  const enrollment: ClassEnrollment = { classId, studentId, joinedAt: FieldValue.serverTimestamp() as never, status: 'ACTIVE' };
  await enrollmentReference.set(enrollment);
  return enrollment;
}

export async function getOwnedClass(teacherId: string, classId: string): Promise<Class> {
  const snapshot = await classes.doc(classId).get();
  if (!snapshot.exists || snapshot.data()?.teacherId !== teacherId) throw new AppError(404, 'Class was not found');
  return snapshot.data() as Class;
}

export async function getStudentClasses(studentId: string): Promise<Class[]> {
  const enrollmentSnapshot = await enrollments.where('studentId', '==', studentId).get();
  const results = await Promise.all(enrollmentSnapshot.docs.map(async (enrollment) => {
    const snapshot = await classes.doc(enrollment.data().classId).get();
    return snapshot.exists ? snapshot.data() as Class : null;
  }));
  return results.filter((value): value is Class => value !== null);
}
