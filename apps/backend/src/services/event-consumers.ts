import { BaseDomainEvent, AssignmentCreatedEvent, HomeworkScannedEvent, PaymentCompletedEvent } from '../events/domain-events';
import { InMemoryMessageBus, MessageBusConsumer } from './message-bus';

export class NotificationConsumer implements MessageBusConsumer<AssignmentCreatedEvent['payload']> {
  async handle(event: BaseDomainEvent<AssignmentCreatedEvent['payload']>): Promise<void> {
    if (event.type !== 'AssignmentCreatedEvent') return;
    console.log('Notification Service: broadcast assignment reminder', event.payload.assignmentId);
  }
}

export class ScheduleSyncConsumer implements MessageBusConsumer<HomeworkScannedEvent['payload']> {
  async handle(event: BaseDomainEvent<HomeworkScannedEvent['payload']>): Promise<void> {
    if (event.type !== 'HomeworkScannedEvent') return;
    console.log('Schedule service: update deadline from scanned homework', event.payload.studentId, event.payload.extractedDueDate);
  }
}

export class BillingConsumer implements MessageBusConsumer<PaymentCompletedEvent['payload']> {
  async handle(event: BaseDomainEvent<PaymentCompletedEvent['payload']>): Promise<void> {
    if (event.type !== 'PaymentCompletedEvent') return;
    console.log('Billing service: reconcile payment', event.payload.orderId, event.payload.amount);
  }
}

export async function bootstrapDomainConsumers(): Promise<void> {
  await InMemoryMessageBus.consume('AssignmentCreatedEvent', new NotificationConsumer());
  await InMemoryMessageBus.consume('HomeworkScannedEvent', new ScheduleSyncConsumer());
  await InMemoryMessageBus.consume('PaymentCompletedEvent', new BillingConsumer());
}
