export type SyncOperation = 'UPSERT_SCHEDULE' | 'UPSERT_DEADLINE' | 'UPSERT_CLASS' | 'UPSERT_MICRO_PROFILE';
export type SyncState = 'PENDING' | 'IN_FLIGHT' | 'FAILED' | 'SYNCED' | 'DEAD_LETTER';

export interface ScheduleRecord {
  id: string;
  userId: string;
  classId: string;
  title: string;
  dueDate: string;
  description?: string;
  updatedAt: string;
  serverUpdatedAt?: string;
  pendingSync: boolean;
}

export interface ClassRecord {
  id: string;
  teacherId: string;
  className: string;
  subject: string;
  classCode: string;
  updatedAt: string;
}

export interface MicroProfileRecord {
  id: string;
  classId: string;
  studentId: string;
  teacherNotes: string;
  tagFlags: string[];
  updatedAt: string;
}

export interface Mutation<T = Record<string, unknown>> {
  id: string;
  operation: SyncOperation;
  entityId: string;
  payload: T;
  clientUpdatedAt: string;
  attempts: number;
  state: SyncState;
  lastError?: string;
}

export interface SyncApiClient {
  pushMutation(mutation: Mutation): Promise<{ accepted: boolean; serverUpdatedAt?: string }>;
}

export interface ConnectivityMonitor {
  isOnline(): Promise<boolean>;
  subscribe(listener: (online: boolean) => void): () => void;
}

export interface FcmMessage {
  eventType: string;
  targetScreen: string;
  classId: string;
  assignmentId: string;
}
