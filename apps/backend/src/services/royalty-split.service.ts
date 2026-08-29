export interface RoyaltySplitInput {
  grossAmountVnd: number;
  platformCommissionRate?: number;
  sellerShareRate?: number;
}

export interface RoyaltySplitResult {
  grossAmountVnd: number;
  platformFeeVnd: number;
  sellerPayoutVnd: number;
  sellerShareRate: number;
  platformCommissionRate: number;
}

export class RoyaltySplitService {
  static calculate(input: RoyaltySplitInput): RoyaltySplitResult {
    const platformCommissionRate = input.platformCommissionRate ?? 0.2;
    const sellerShareRate = input.sellerShareRate ?? 0.8;
    const grossAmountVnd = Number(input.grossAmountVnd) || 0;
    const platformFeeVnd = Math.round(grossAmountVnd * platformCommissionRate);
    const sellerPayoutVnd = Math.round(grossAmountVnd * sellerShareRate);

    return {
      grossAmountVnd,
      platformFeeVnd,
      sellerPayoutVnd,
      sellerShareRate,
      platformCommissionRate,
    };
  }

  static monthlyBatchPayouts(payments: Array<{ userId: string; sellerPayoutVnd: number; kycStatus: 'VERIFIED' | 'PENDING'; taxWithheldVnd?: number }>): Array<{ userId: string; payoutVnd: number; taxWithheldVnd: number; status: 'QUEUED' | 'PENDING' | 'PAID' }> {
    return payments.map((payment) => ({
      userId: payment.userId,
      payoutVnd: payment.kycStatus === 'VERIFIED' ? payment.sellerPayoutVnd : 0,
      taxWithheldVnd: payment.taxWithheldVnd ?? Math.round(payment.sellerPayoutVnd * 0.05),
      status: payment.kycStatus === 'VERIFIED' ? 'QUEUED' : 'PENDING',
    }));
  }
}
