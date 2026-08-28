import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'STUDENT' | 'TEACHER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  fcmTokens: string[];
}

export interface ScheduleInfo {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
  location?: string;
}

export interface Class {
  id: string;
  teacherId: string;
  className: string;
  subject: string;
  classCode: string;
  scheduleInfo: ScheduleInfo[];
}

export interface ClassEnrollment {
  classId: string;
  studentId: string;
  joinedAt: Timestamp;
  status: 'ACTIVE' | 'LEFT' | 'REMOVED';
}

export interface AssignmentAttachment {
  name: string;
  url: string;
  contentType?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  attachments: AssignmentAttachment[];
}

export interface StudentMicroProfile {
  classId: string;
  studentId: string;
  teacherNotes: string;
  updatedAt: Timestamp;
}

export interface ScheduleItem extends Assignment {
  type: 'ASSIGNMENT';
  syncedAt: Timestamp;
}
