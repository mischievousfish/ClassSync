import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AttendanceRecord, AttendanceStatus } from '../models';
import { AppError } from '../shared/errors';
import { AttendanceQrPayload, DynamicQRGenerator } from './dynamic-qr.generator';

export interface LocationPoint { latitude: number; longitude: number; }
export interface AttendanceVerificationInput { classId: string; sessionDate: string; studentId: string; location?: LocationPoint; qr?: AttendanceQrPayload; beaconUuid?: string; nfcTagId?: string; }

function distanceMeters(left: LocationPoint, right: LocationPoint): number {
  const earthRadius = 6_371_000; const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(right.latitude - left.latitude); const longitudeDelta = radians(right.longitude - left.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export class AttendanceVerificationService {
  constructor(private readonly qrGenerator = new DynamicQRGenerator()) {}

  async createDynamicQr(sessionId: string, classId: string) { return this.qrGenerator.generate(sessionId, classId); }

  async verify(input: AttendanceVerificationInput, recordedByUserId: string): Promise<AttendanceRecord> {
    const classSnapshot = await db.collection('classes').doc(input.classId).get();
    if (!classSnapshot.exists) throw new AppError(404, 'Class was not found');
    const classData = classSnapshot.data() as { locationCoordinates?: LocationPoint; beaconUuid?: string; nfcTagId?: string; orgId?: string; teacherId?: string };
    const locationValid = Boolean(input.location && classData.locationCoordinates && distanceMeters(input.location, classData.locationCoordinates) <= 50);
    const qrValid = Boolean(input.qr && this.qrGenerator.verify(input.qr) && input.qr.classId === input.classId);
    const beaconValid = Boolean(input.beaconUuid && classData.beaconUuid && input.beaconUuid === classData.beaconUuid);
    const nfcValid = Boolean(input.nfcTagId && classData.nfcTagId && input.nfcTagId === classData.nfcTagId);
    if (!locationValid && !qrValid && !beaconValid && !nfcValid) throw new AppError(403, 'Attendance could not be verified by location, QR, BLE beacon, or NFC tag');
    const reference = db.collection('attendance_records').doc(`${input.classId}_${input.studentId}_${input.sessionDate}`);
    const record: AttendanceRecord = { id: reference.id, orgId: classData.orgId, classId: input.classId, studentId: input.studentId, sessionDate: input.sessionDate, status: 'PRESENT', recordedByUserId };
    await reference.set({ ...record, verifiedBy: { location: locationValid, qr: qrValid, ble: beaconValid, nfc: nfcValid }, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    return record;
  }
}