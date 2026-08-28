import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { Assignment, ScheduleItem } from '../models';
import { AppError } from '../shared/errors';
import { getOwnedClass } from './class.service';
import { enqueueAssignmentSync } from './notification-publisher.worker';

const assignments = db.collection('assignments');

export async function createAssignment(teacherId: string, input: Omit<Assignment, 'id' | 'teacherId' | 'dueDate'> & { dueDate: Date }): Promise<Assignment & { syncJobId: string }> {
  await getOwnedClass(teacherId, input.classId);
  const reference = assignments.doc();
  const assignment: Assignment = {
    id: reference.id,
    teacherId,
    classId: input.classId,
    title: input.title,
    description: input.description,
    dueDate: Timestamp.fromDate(input.dueDate),
    attachments: input.attachments,
  };
  await reference.set(assignment);
  const syncJob = await enqueueAssignmentSync(assignment.id, assignment.classId);
  return { ...assignment, syncJobId: syncJob.id };
}

export async function getStudentSchedule(studentId: string): Promise<ScheduleItem[]> {
  const snapshot = await db.collection('studentSchedules').doc(studentId).collection('items')
    .where('dueDate', '>=', Timestamp.now()).orderBy('dueDate', 'asc').get();
  return snapshot.docs.map((document) => document.data() as ScheduleItem);
}
