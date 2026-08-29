import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, messaging } from '../config/firebase';
import { ParentPreferredChannel, ParentProfile } from '../models';
import { ZaloZnsProvider, NotificationDeliveryResult } from './zalo-zns.provider';

export type ParentEventType = 'ATTENDANCE_ALERT' | 'HOMEWORK_WARNING' | 'MONTHLY_TUITION_BILL';

export interface ParentNotification {
  orgId?: string;
  studentId: string;
  eventType: ParentEventType;
  templateId: string;
  templateData: Record<string, string>;
  title: string;
  body: string;
}

interface ChannelProvider {
  send(profile: ParentProfile, notification: ParentNotification): Promise<NotificationDeliveryResult>;
}

class SmsGatewayProvider implements ChannelProvider {
  async send(profile: ParentProfile, notification: ParentNotification): Promise<NotificationDeliveryResult> {
    const endpoint = process.env.SMS_GATEWAY_ENDPOINT;
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    if (!endpoint || !apiKey) return { delivered: false, provider: 'SMS', reason: 'SMS gateway is not configured' };
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to: profile.phoneNumber, message: notification.body }),
    });
    return response.ok ? { delivered: true, provider: 'SMS' } : { delivered: false, provider: 'SMS', reason: `SMS HTTP ${response.status}` };
  }
}

class InAppPushProvider implements ChannelProvider {
  async send(profile: ParentProfile, notification: ParentNotification): Promise<NotificationDeliveryResult> {
    const user = await db.collection('users').doc(profile.userId).get();
    const tokens = (user.data()?.fcmTokens ?? []) as string[];
    if (!tokens.length) return { delivered: false, provider: 'IN_APP_PUSH', reason: 'Parent has no registered push token' };
    const response = await messaging.sendEachForMulticast({ tokens, notification: { title: notification.title, body: notification.body }, data: { eventType: notification.eventType, studentId: notification.studentId } });
    return response.successCount ? { delivered: true, provider: 'IN_APP_PUSH' } : { delivered: false, provider: 'IN_APP_PUSH', reason: 'FCM delivery failed' };
  }
}

const channelOrder: Record<ParentPreferredChannel, Array<'ZALO' | 'SMS' | 'IN_APP_PUSH'>> = {
  ZALO: ['ZALO', 'SMS', 'IN_APP_PUSH'], SMS: ['SMS', 'IN_APP_PUSH'], IN_APP_PUSH: ['IN_APP_PUSH', 'SMS'],
};

export class ParentNotificationService {
  constructor(private readonly zalo = new ZaloZnsProvider(), private readonly sms: ChannelProvider = new SmsGatewayProvider(), private readonly push: ChannelProvider = new InAppPushProvider()) {}

  sendAttendanceAlert(input: { orgId?: string; studentId: string; studentName: string; className: string; sessionDate: string; status: string }) {
    return this.send({ orgId: input.orgId, studentId: input.studentId, eventType: 'ATTENDANCE_ALERT', templateId: process.env.ZALO_ATTENDANCE_TEMPLATE_ID ?? 'attendance-alert', templateData: { studentName: input.studentName, className: input.className, sessionDate: input.sessionDate, status: input.status }, title: 'Cập nhật điểm danh', body: `${input.studentName} được ghi nhận ${input.status} trong lớp ${input.className} ngày ${input.sessionDate}.` });
  }

  sendHomeworkWarning(input: { orgId?: string; studentId: string; studentName: string; missedCount?: number }) {
    const missedCount = input.missedCount ?? 2;
    return this.send({ orgId: input.orgId, studentId: input.studentId, eventType: 'HOMEWORK_WARNING', templateId: process.env.ZALO_HOMEWORK_TEMPLATE_ID ?? 'homework-warning', templateData: { studentName: input.studentName, missedCount: String(missedCount) }, title: 'Nhắc nhở bài tập', body: `${input.studentName} đã bỏ lỡ ${missedCount} hạn nộp bài liên tiếp.` });
  }

  sendMonthlyTuitionBill(input: { orgId?: string; studentId: string; billingCycle: string; amount: number; qrLink: string }) {
    return this.send({ orgId: input.orgId, studentId: input.studentId, eventType: 'MONTHLY_TUITION_BILL', templateId: process.env.ZALO_TUITION_TEMPLATE_ID ?? 'monthly-tuition-bill', templateData: { billingCycle: input.billingCycle, amount: String(input.amount), qrLink: input.qrLink }, title: 'Thông báo học phí', body: `Học phí tháng ${input.billingCycle}: ${input.amount}. Thanh toán: ${input.qrLink}` });
  }

  async send(notification: ParentNotification): Promise<NotificationDeliveryResult & { duplicate?: boolean }> {
    const profileSnapshot = await db.collection('parent_profiles').where('studentIds', 'array-contains', notification.studentId).limit(1).get();
    if (profileSnapshot.empty) return { delivered: false, provider: 'NONE', reason: 'Parent profile was not found' };
    const profile = profileSnapshot.docs[0].data() as ParentProfile;
    const eventKey = `${profile.id}_${notification.studentId}_${notification.eventType}`;
    const eventReference = db.collection('parent_notification_events').doc(eventKey);
    const cutoff = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const reserved = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(eventReference);
      if (existing.exists && (existing.data()?.createdAt as Timestamp)?.toMillis?.() > cutoff.toMillis()) return false;
      transaction.set(eventReference, { orgId: notification.orgId, eventKey, status: 'PROCESSING', createdAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!reserved) return { delivered: true, provider: 'DEDUPLICATED', duplicate: true };

    const providers: Record<'ZALO' | 'SMS' | 'IN_APP_PUSH', ChannelProvider> = {
      ZALO: { send: async () => this.zalo.send({ phoneNumber: profile.phoneNumber, templateId: notification.templateId, templateData: notification.templateData }) },
      SMS: this.sms, IN_APP_PUSH: this.push,
    };
    let result: NotificationDeliveryResult = { delivered: false, provider: 'NONE', reason: 'No provider attempted' };
    for (const channel of channelOrder[profile.preferredChannel]) {
      result = await providers[channel].send(profile, notification);
      if (result.delivered) break;
    }
    await eventReference.update({ status: result.delivered ? 'DELIVERED' : 'FAILED', provider: result.provider, reason: result.reason ?? null, completedAt: FieldValue.serverTimestamp() });
    return result;
  }
}