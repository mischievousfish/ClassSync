import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AppError } from '../shared/errors';
import { generateStructuredJson } from './ai.service';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';

export interface DiagnosticNote {
  id: string;
  orgId?: string;
  studentId: string;
  generatedForTeacherId?: string;
  summary: string;
  recommendations: string[];
  status: 'AI_DRAFT' | 'REVIEWED';
  pinned: boolean;
  createdAt: unknown;
  reviewedAt?: unknown;
}

interface GeneratedDiagnostic {
  summary: string;
  recommendations: string[];
}

const diagnosticSchema = { type: 'object', properties: { summary: { type: 'string' }, recommendations: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'recommendations'] };

export class MicroProfileAIGenerator {
  constructor(private readonly aggregator = new AnalyticsAggregatorService()) {}

  async generate(studentId: string, options: { orgId?: string; teacherId?: string } = {}): Promise<DiagnosticNote> {
    const matrix = await this.aggregator.getStudentPerformanceMatrix(studentId, 30, options.orgId);
    const diagnostic = await generateStructuredJson<GeneratedDiagnostic>(`Write a concise teacher-facing diagnostic for student ${studentId}. Use only this 30-day performance JSON: ${JSON.stringify(matrix)}. Mention missed deadlines only when supported by timelySubmissionRate, identify the weakest topics, and give concrete interventions. Return JSON with summary and recommendations array.`, diagnosticSchema);
    const reference = db.collection('student_diagnostic_notes').doc();
    const note: DiagnosticNote = { id: reference.id, orgId: options.orgId, studentId, generatedForTeacherId: options.teacherId, summary: diagnostic.summary, recommendations: diagnostic.recommendations.slice(0, 5), status: 'AI_DRAFT', pinned: false, createdAt: FieldValue.serverTimestamp() };
    await reference.set(note);
    return note;
  }

  async review(noteId: string, input: { summary?: string; recommendations?: string[]; pinned?: boolean }, orgId?: string): Promise<void> {
    const reference = db.collection('student_diagnostic_notes').doc(noteId);
    const snapshot = await reference.get();
    if (!snapshot.exists || (orgId && snapshot.data()?.orgId !== orgId)) throw new AppError(404, 'Diagnostic note was not found');
    await reference.update({ ...input, recommendations: input.recommendations?.slice(0, 5), status: 'REVIEWED', reviewedAt: FieldValue.serverTimestamp() });
  }
}