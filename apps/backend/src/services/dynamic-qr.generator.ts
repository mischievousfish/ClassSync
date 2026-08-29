import { createHmac, randomBytes } from 'node:crypto';

export interface AttendanceQrPayload { sessionId: string; classId: string; expiresAt: number; token: string; }

export class DynamicQRGenerator {
  constructor(private readonly secret = process.env.ATTENDANCE_QR_SECRET ?? randomBytes(32).toString('hex')) {}

  generate(sessionId: string, classId: string, now = Date.now()): AttendanceQrPayload {
    const expiresAt = now + 5_000;
    const token = createHmac('sha256', this.secret).update(`${sessionId}:${classId}:${Math.floor(now / 5_000)}`).digest('hex');
    return { sessionId, classId, expiresAt, token };
  }

  verify(payload: AttendanceQrPayload, now = Date.now()): boolean {
    if (payload.expiresAt < now) return false;
    const expected = this.generate(payload.sessionId, payload.classId, payload.expiresAt - 5_000).token;
    return expected === payload.token;
  }
}