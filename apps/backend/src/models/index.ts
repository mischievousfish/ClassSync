import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'STUDENT' | 'TEACHER' | EnterpriseOrgRole;

export type SubscriptionTier = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type EnterpriseOrgRole = 'ORG_ADMIN' | 'BRANCH_MANAGER' | 'STAFF_TEACHER' | 'TEACHING_ASSISTANT';

export interface OrganizationSettings {
  fcm?: { serverKey?: string };
  zalo?: { accessToken?: string; appId?: string };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  subscriptionTier: SubscriptionTier;
  allowedTeacherSeats: number;
  allowedStudentSeats: number;
  customDomain?: string;
  settings: OrganizationSettings;
  createdAt: Timestamp;
}

export interface Branch {
  id: string;
  orgId: string;
  branchName: string;
  address: string;
  managerUserId?: string;
  createdAt: Timestamp;
}

export interface OrganizationMembership {
  id: string;
  orgId: string;
  userId: string;
  orgRole: EnterpriseOrgRole;
  assignedBranchIds: string[];
  createdAt: Timestamp;
}

export interface SharedCurriculumLibraryItem {
  id: string;
  orgId: string;
  createdById: string;
  title: string;
  subject: string;
  gradeLevel: string;
  folderId?: string;
  contentPayload: Record<string, unknown>;
  isTemplate: boolean;
  createdAt: Timestamp;
}

export type ParentPreferredChannel = 'ZALO' | 'SMS' | 'IN_APP_PUSH';
export type TuitionBillStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID';
export type PaymentMethod = 'BANK_TRANSFER' | 'VIETQR' | 'PAYOS' | 'CASSO' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED' | 'LATE';

export interface ParentProfile {
  id: string;
  userId: string;
  phoneNumber: string;
  studentIds: string[];
  preferredChannel: ParentPreferredChannel;
}

export interface TuitionBill {
  id: string;
  orgId?: string;
  teacherId?: string;
  studentId: string;
  classId: string;
  billingCycle: string;
  amountDue: number;
  discountAmount: number;
  amountPaid?: number;
  status: TuitionBillStatus;
  dueDate: Timestamp;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  orgId?: string;
  classId: string;
  studentId: string;
  sessionDate: string;
  status: AttendanceStatus;
  recordedByUserId: string;
}

export type GamificationQuestType = 'COMPLETE_3_DEADLINES' | 'SCAN_1_OCR_ASSIGNMENT' | 'REVIEW_WEAK_TOPIC';
export type GamificationQuestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
export type GamificationActionType = 'SUBMIT_HOMEWORK' | 'COMPLETE_TASK' | 'REVIEW_AI_QUIZ' | 'SCAN_OCR';

export interface StudentGamificationProfile {
  userId: string;
  currentXP: number;
  level: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate?: string;
  coinsBalance: number;
  streakFreezeTokens: number;
  unlockedBadges: string[];
  inventoryItems: string[];
  updatedAt: Timestamp;
}

export interface BadgeMaster {
  id: string;
  code: string;
  title: string;
  description: string;
  iconUrl?: string;
  xpReward: number;
  conditionRuleJson: Record<string, unknown>;
}

export interface DailyQuest {
  id: string;
  userId: string;
  questType: GamificationQuestType;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  coinReward: number;
  expiresAt: Timestamp;
  status: GamificationQuestStatus;
}

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
