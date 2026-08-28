import { FcmMessage } from '../sync/types';

export interface FcmClient {
  onMessage(listener: (message: { data?: Record<string, string> }) => void): () => void;
  onNotificationOpenedApp(listener: (message: { data?: Record<string, string> }) => void): () => void;
  getInitialNotification(): Promise<{ data?: Record<string, string }> | null>;
}

export type NotificationNavigator = (route: { screen: string; classId: string; assignmentId: string }) => void;

export class FCMHandler {
  private unsubscribeForeground?: () => void;
  private unsubscribeOpened?: () => void;

  constructor(private readonly client: FcmClient, private readonly navigate: NotificationNavigator) {}

  async initialize(): Promise<void> {
    this.unsubscribeForeground = this.client.onMessage((message) => this.handle(message));
    this.unsubscribeOpened = this.client.onNotificationOpenedApp((message) => this.handle(message));
    const initial = await this.client.getInitialNotification();
    if (initial) this.handle(initial);
  }

  dispose(): void {
    this.unsubscribeForeground?.();
    this.unsubscribeOpened?.();
  }

  private handle(message: { data?: Record<string, string> }): void {
    const data = message.data;
    if (!data || data.eventType !== 'ASSIGNMENT_UPSERTED' || !data.classId || !data.assignmentId) return;
    const payload: FcmMessage = {
      eventType: data.eventType,
      targetScreen: data.targetScreen ?? 'assignment-detail',
      classId: data.classId,
      assignmentId: data.assignmentId,
    };
    this.navigate({ screen: payload.targetScreen, classId: payload.classId, assignmentId: payload.assignmentId });
  }
}
