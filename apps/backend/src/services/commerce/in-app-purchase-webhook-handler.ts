export interface IapWebhookEvent {
  eventId: string;
  transactionId: string;
  productId: string;
  receipt?: string;
  status: 'PAID' | 'CANCELLED' | 'REFUNDED';
  customerId: string;
  amount?: number;
}

export interface IapWebhookResult {
  accepted: boolean;
  duplicate: boolean;
  eventId: string;
  status: string;
}

export class InAppPurchaseWebhookHandler {
  private readonly processedEvents = new Set<string>();

  async handleWebhook(event: IapWebhookEvent): Promise<IapWebhookResult> {
    const eventKey = event.eventId || event.transactionId;
    if (!eventKey) {
      return { accepted: false, duplicate: false, eventId: event.eventId || 'unknown', status: 'REJECTED' };
    }

    if (this.processedEvents.has(eventKey)) {
      return { accepted: false, duplicate: true, eventId: eventKey, status: 'DUPLICATE' };
    }

    this.processedEvents.add(eventKey);

    if (event.status === 'PAID') {
      return { accepted: true, duplicate: false, eventId: eventKey, status: 'PROCESSED' };
    }

    return { accepted: true, duplicate: false, eventId: eventKey, status: 'CANCELLED' };
  }
}
