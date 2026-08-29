import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TenantRequest } from '../middleware/tenant';
import { getParentDashboard, generateMonthlyBills, receivePayment } from '../services/tuition-billing.service';
import { VietQRGeneratorService } from '../services/vietqr-generator.service';
import { db } from '../config/firebase';
import { AppError } from '../shared/errors';

export async function generateMonthlyBillingController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.status(201).json(await generateMonthlyBills((request as TenantRequest).tenant.orgId, String(request.body.billingCycle))); } catch (error) { next(error); }
}

export async function generateVietQrController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const snapshot = await db.collection('tuition_bills').doc(String(request.params.billId)).get();
    if (!snapshot.exists) throw new AppError(404, 'Tuition bill was not found');
    const bill = snapshot.data() as { orgId?: string; amountDue: number; discountAmount: number; studentId: string; billingCycle: string };
    if (bill.orgId !== (request as TenantRequest).tenant.orgId) throw new AppError(404, 'Tuition bill was not found');
    const payload = VietQRGeneratorService.generate({ bankBin: process.env.VIETQR_BANK_BIN ?? '', accountNumber: process.env.VIETQR_ACCOUNT_NUMBER ?? '', amount: bill.amountDue - bill.discountAmount, transferDescription: `CLASSSYNC ${bill.billingCycle} ${bill.studentId}` });
    response.json({ payload, format: 'EMVCo-QR', billId: request.params.billId });
  } catch (error) { next(error); }
}

export async function paymentReceivedController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (process.env.PAYMENT_WEBHOOK_SECRET && request.header('x-webhook-secret') !== process.env.PAYMENT_WEBHOOK_SECRET) throw new AppError(401, 'Invalid payment webhook signature');
    response.json(await receivePayment({ billId: String(request.body.billId), transactionRef: String(request.body.transactionRef), amount: Number(request.body.amount), paymentMethod: request.body.paymentMethod }));
  } catch (error) { next(error); }
}

export async function parentDashboardController(request: Request, response: Response, next: NextFunction): Promise<void> {
  try { response.json(await getParentDashboard((request as AuthenticatedRequest).user.id, String(request.params.studentId))); } catch (error) { next(error); }
}