import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { StudentMicroProfile } from '../models';
import { AppError } from '../shared/errors';
import { getOwnedClass } from './class.service';

export async function updateStudentNotes(teacherId: string, studentId: string, classId: string, teacherNotes: string): Promise<StudentMicroProfile> {
  await getOwnedClass(teacherId, classId);
  const enrollment = await db.collection('classEnrollments').doc(`${classId}_${studentId}`).get();
  if (!enrollment.exists) throw new AppError(404, 'Student is not enrolled in this class');
  const profile: StudentMicroProfile = { classId, studentId, teacherNotes, updatedAt: FieldValue.serverTimestamp() as never };
  await db.collection('studentMicroProfiles').doc(`${classId}_${studentId}`).set(profile, { merge: true });
  return profile;
}
