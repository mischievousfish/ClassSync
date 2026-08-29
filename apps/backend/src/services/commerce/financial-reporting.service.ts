export interface FinancialMetricsInput {
  mrr: number;
  arr?: number;
  churnRate: number;
  nrr: number;
  ltv: number;
  cac: number;
  grossProfitMargin: number;
  activeCustomers: number;
}

export interface FinancialMetricsResult {
  mrr: number;
  nrr: number;
  churnRate: number;
  ltvToCacRatio: number;
  grossProfitMargin: number;
  activeCustomers: number;
}

export class FinancialReportingService {
  calculateMetrics(input: FinancialMetricsInput): FinancialMetricsResult {
    return {
      mrr: Number(input.mrr.toFixed(2)),
      nrr: Number(input.nrr.toFixed(2)),
      churnRate: Number(input.churnRate.toFixed(2)),
      ltvToCacRatio: Number((input.ltv / Math.max(input.cac, 1)).toFixed(2)),
      grossProfitMargin: Number(input.grossProfitMargin.toFixed(2)),
      activeCustomers: input.activeCustomers,
    };
  }
}
