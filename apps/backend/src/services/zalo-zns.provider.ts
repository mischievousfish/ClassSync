export interface ZaloTemplateMessage {
  phoneNumber: string;
  templateId: string;
  templateData: Record<string, string>;
}

export interface NotificationDeliveryResult {
  delivered: boolean;
  provider: string;
  messageId?: string;
  reason?: string;
}

export class ZaloZnsProvider {
  private readonly endpoint = process.env.ZALO_ZNS_ENDPOINT ?? 'https://business.openapi.zalo.me/message/template';

  async send(message: ZaloTemplateMessage): Promise<NotificationDeliveryResult> {
    const accessToken = process.env.ZALO_OA_ACCESS_TOKEN;
    if (!accessToken) return { delivered: false, provider: 'ZALO', reason: 'Zalo OA access token is not configured' };
    const response = await fetch(this.endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ phone: message.phoneNumber, template_id: message.templateId, template_data: message.templateData }),
    });
    const body = await response.json() as { error?: number; message?: string; data?: { msg_id?: string } };
    if (!response.ok || body.error) return { delivered: false, provider: 'ZALO', reason: body.message ?? `Zalo HTTP ${response.status}` };
    return { delivered: true, provider: 'ZALO', messageId: body.data?.msg_id };
  }
}