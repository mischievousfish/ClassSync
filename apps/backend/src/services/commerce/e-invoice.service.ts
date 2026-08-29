export type EInvoiceProvider = 'VNPT' | 'VIETTEL';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface TaxCalculationInput {
  customerCountry: string;
  customerRegion?: string;
  subtotal: number;
}

export interface EInvoiceRequest {
  invoiceId: string;
  customerName: string;
  customerTaxCode?: string;
  provider: EInvoiceProvider;
  currency: string;
  subtotal: number;
  lines: InvoiceLineItem[];
  customerCountry: string;
}

export class EInvoiceService {
  calculateTax(input: TaxCalculationInput): { taxRate: number; taxAmount: number; total: number } {
    const country = input.customerCountry.toUpperCase();
    let taxRate = 0;

    if (country === 'VN') taxRate = 0.1;
    else if (country === 'TH' || country === 'ID') taxRate = 0.07;
    else if (country === 'SG' || country === 'MY') taxRate = 0.08;

    const taxAmount = input.subtotal * taxRate;
    return {
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number((input.subtotal + taxAmount).toFixed(2)),
    };
  }

  issueInvoice(input: EInvoiceRequest): { invoiceId: string; provider: EInvoiceProvider; status: string; taxBreakdown: { taxRate: number; taxAmount: number; total: number }; issuedAt: string } {
    const taxBreakdown = this.calculateTax({ customerCountry: input.customerCountry, subtotal: input.subtotal });
    return {
      invoiceId: input.invoiceId,
      provider: input.provider,
      status: 'ISSUED',
      taxBreakdown,
      issuedAt: new Date().toISOString(),
    };
  }
}
