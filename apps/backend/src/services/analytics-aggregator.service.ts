import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AttendanceRecord } from '../models';
import { KnowledgeObservation, KnowledgeTracingEngine, MasteryEstimate } from './knowledge-tracing.engine';

export interface QuestionEvent extends KnowledgeObservation {
  studentId: string;
  assignmentId: string;
  submittedAt: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface StudentPerformanceRow extends MasteryEstimate {
  accuracy: number;
  averageCompletionMinutes: number;
  timelySubmissionRate: number;
}

export interface StudentPerformanceMatrix {
  studentId: string;
  topics: StudentPerformanceRow[];
  attendanceConsistency: number;
  attendanceRate: number;
  windowStart: string;
  windowEnd: string;
}

export interface ClassWeakSpot {
  topic: string;
  failedQuestionRate: number;
  affectedStudents: number;
  questionCount: number;
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') { const date = new Date(value); return Number.isNaN(date.getTime()) ? undefined : date; }
  return undefined;
}

function getQuestionEvents(studentId: string, documents: Array<Record<string, unknown>>): QuestionEvent[] {
  const events: QuestionEvent[] = [];
  for (const document of documents) {
    const submittedAt = dateValue(document.submittedAt ?? document.completedAt ?? document.createdAt);
    if (!submittedAt) continue;
    const dueDate = dateValue(document.dueDate);
    const questions = Array.isArray(document.questionResults) ? document.questionResults : Array.isArray(document.answers) ? document.answers : [];
    for (const question of questions as Array<Record<string, unknown>>) {
      const tags = Array.isArray(question.topicTags) ? question.topicTags : [question.topicTag ?? document.topic];
      const correct = typeof question.correct === 'boolean' ? question.correct : question.isCorrect === true;
      for (const topic of tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)) events.push({ studentId, assignmentId: String(document.assignmentId ?? document.id ?? ''), topic, correct, observedAt: submittedAt, submittedAt, dueDate, startedAt: dateValue(document.startedAt), completedAt: dateValue(document.completedAt) });
    }
  }
  return events;
}

export class AnalyticsAggregatorService {
  constructor(private readonly engine = new KnowledgeTracingEngine()) {}

  async getStudentPerformanceMatrix(studentId: string, windowDays = 30, orgId?: string): Promise<StudentPerformanceMatrix> {
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowDays * 86_400_000);
    let submissionsQuery = db.collection('assignmentSubmissions').where('studentId', '==', studentId);
    let attendanceQuery = db.collection('attendance_records').where('studentId', '==', studentId);
    if (orgId) { submissionsQuery = submissionsQuery.where('orgId', '==', orgId); attendanceQuery = attendanceQuery.where('orgId', '==', orgId); }
    const [submissions, attendance] = await Promise.all([submissionsQuery.get(), attendanceQuery.get()]);
    const events = getQuestionEvents(studentId, submissions.docs.map((document) => document.data() as Record<string, unknown>)).filter((event) => event.submittedAt >= windowStart);
    const topics = this.engine.estimateAll(events, windowEnd).map((estimate) => {
      const topicEvents = events.filter((event) => event.topic === estimate.topic);
      const completedMinutes = topicEvents.map((event) => event.startedAt && event.completedAt ? (event.completedAt.getTime() - event.startedAt.getTime()) / 60_000 : undefined).filter((value): value is number => value != null && value >= 0);
      const timely = topicEvents.filter((event) => event.dueDate && event.submittedAt <= event.dueDate).length;
      return { ...estimate, accuracy: topicEvents.filter((event) => event.correct).length / topicEvents.length * 100, averageCompletionMinutes: completedMinutes.length ? completedMinutes.reduce((sum, value) => sum + value, 0) / completedMinutes.length : 0, timelySubmissionRate: topicEvents.length ? timely / topicEvents.length * 100 : 0 };
    });
    const records = attendance.docs.map((document) => document.data() as AttendanceRecord).filter((record) => record.sessionDate >= windowStart.toISOString().slice(0, 10));
    const attended = records.filter((record) => ['PRESENT', 'LATE'].includes(record.status)).length;
    return { studentId, topics, attendanceConsistency: records.length ? records.filter((record) => record.status === 'PRESENT').length / records.length * 100 : 0, attendanceRate: records.length ? attended / records.length * 100 : 0, windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() };
  }

  async getClassIntelligence(classId: string, orgId?: string): Promise<{ classId: string; weakSpots: ClassWeakSpot[]; studentMatrices: StudentPerformanceMatrix[] }> {
    const enrollments = await db.collection('classEnrollments').where('classId', '==', classId).where('status', '==', 'ACTIVE').get();
    const studentMatrices = await Promise.all(enrollments.docs.map((document) => this.getStudentPerformanceMatrix(String(document.data().studentId), 30, orgId)));
    let submissionsQuery = db.collection('assignmentSubmissions').where('classId', '==', classId);
    if (orgId) submissionsQuery = submissionsQuery.where('orgId', '==', orgId);
    const submissions = await submissionsQuery.get();
    const topicResults = new Map<string, { failed: number; total: number; students: Set<string> }>();
    for (const submission of submissions.docs) {
      const document = submission.data() as Record<string, unknown>;
      const events = getQuestionEvents(String(document.studentId ?? ''), [document]);
      for (const event of events) { const current = topicResults.get(event.topic) ?? { failed: 0, total: 0, students: new Set<string>() }; current.total += 1; if (!event.correct) { current.failed += 1; current.students.add(event.studentId); } topicResults.set(event.topic, current); }
    }
    const weakSpots = [...topicResults.entries()].map(([topic, result]) => ({ topic, failedQuestionRate: result.failed / result.total * 100, affectedStudents: result.students.size, questionCount: result.total })).sort((left, right) => right.failedQuestionRate - left.failedQuestionRate);
    return { classId, weakSpots, studentMatrices };
  }

  async exportClassReport(classId: string, orgId?: string): Promise<string> {
    const intelligence = await this.getClassIntelligence(classId, orgId);
    const rows = ['studentId,topic,mastery,accuracy,timelySubmissionRate,attendanceRate'];
    for (const matrix of intelligence.studentMatrices) for (const topic of matrix.topics) rows.push([matrix.studentId, topic.topic, topic.mastery, topic.accuracy, topic.timelySubmissionRate, matrix.attendanceRate].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    return rows.join('\n');
  }
}