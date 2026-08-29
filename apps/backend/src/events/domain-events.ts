export type DomainEventType =
  | 'AssignmentCreatedEvent'
  | 'HomeworkScannedEvent'
  | 'PaymentCompletedEvent'
  | 'OrganizationRegisteredEvent'
  | 'BillingProvisionedEvent';

export interface BaseDomainEvent<T> {
  id: string;
  type: DomainEventType;
  occurredAt: string;
  correlationId: string;
  payload: T;
}

export interface AssignmentCreatedEventPayload {
  assignmentId: string;
  classId: string;
  teacherId: string;
  title: string;
  dueDate: string;
}

export interface HomeworkScannedEventPayload {
  studentId: string;
  rawText: string;
  extractedDueDate?: string;
}

export interface PaymentCompletedEventPayload {
  orderId: string;
  userId: string;
  amount: number;
  method: string;
}

export interface OrganizationRegisteredEventPayload {
  orgId: string;
  adminUserId: string;
  organizationName: string;
}

export interface BillingProvisionedEventPayload {
  orgId: string;
  billingId: string;
  status: 'ACTIVE' | 'FAILED';
}

export type AssignmentCreatedEvent = BaseDomainEvent<AssignmentCreatedEventPayload>;
export type HomeworkScannedEvent = BaseDomainEvent<HomeworkScannedEventPayload>;
export type PaymentCompletedEvent = BaseDomainEvent<PaymentCompletedEventPayload>;
export type OrganizationRegisteredEvent = BaseDomainEvent<OrganizationRegisteredEventPayload>;
export type BillingProvisionedEvent = BaseDomainEvent<BillingProvisionedEventPayload>;
