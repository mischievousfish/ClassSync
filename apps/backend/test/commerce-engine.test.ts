import { SubscriptionManager } from '../src/services/commerce/subscription-manager';
import { PaymentGatewayAbstraction, MockGateway } from '../src/services/commerce/payment-gateway-abstraction';
import { InAppPurchaseWebhookHandler } from '../src/services/commerce/in-app-purchase-webhook-handler';
import { EInvoiceService } from '../src/services/commerce/e-invoice.service';
import { FinancialReportingService } from '../src/services/commerce/financial-reporting.service';

describe('ClassSync Commerce Engine', () => {
  it('supports Pro subscription creation, discounts, and usage overage calculation', () => {
    const manager = new SubscriptionManager();
    const subscription = manager.createSubscription({
      customerId: 'customer-1',
      plan: { id: 'pro-monthly', tier: 'PRO', billingCycle: 'MONTHLY', basePrice: 19.99, currency: 'USD', trialDays: 14 },
      discountCode: 'SAVE10',
    });

    const invoice = manager.calculateUsageInvoice({
      orgId: 'org-1',
      aiTokensUsed: 250000,
      znsMessagesUsed: 350,
      monthlyQuota: { aiTokens: 100000, znsMessages: 200 },
      currency: 'USD',
      overageRate: { aiTokens: 0.002, znsMessages: 0.03 },
    });

    expect(subscription.status).toBe('TRIAL');
    expect(subscription.discountAmount).toBeGreaterThan(0);
    expect(invoice.shouldInvoice).toBe(true);
    expect(invoice.totalAmount).toBeGreaterThan(0);
  });

  it('routes payment checks through a provider abstraction and prevents duplicate IAP events', async () => {
    const abstraction = new PaymentGatewayAbstraction();
    abstraction.registerProvider(new MockGateway('STRIPE'));
    const checkout = await abstraction.createCheckoutSession({ customerId: 'customer-2', amount: 49.99, currency: 'USD', provider: 'STRIPE' });

    const handler = new InAppPurchaseWebhookHandler();
    const first = await handler.handleWebhook({ eventId: 'evt-1', transactionId: 'txn-1', productId: 'pro', status: 'PAID', customerId: 'customer-2' });
    const second = await handler.handleWebhook({ eventId: 'evt-1', transactionId: 'txn-1', productId: 'pro', status: 'PAID', customerId: 'customer-2' });

    expect(checkout.status).toBe('PENDING');
    expect(first.accepted).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  it('calculates VAT correctly for Vietnam and issues e-invoices', () => {
    const service = new EInvoiceService();
    const tax = service.calculateTax({ customerCountry: 'VN', subtotal: 1000 });
    const invoice = service.issueInvoice({
      invoiceId: 'INV-1001',
      customerName: 'ABC Tutoring Center',
      provider: 'VNPT',
      currency: 'VND',
      subtotal: 1000,
      lines: [{ description: 'AI Tutor seats', quantity: 10, unitPrice: 100 }],
      customerCountry: 'VN',
    });

    expect(tax.taxRate).toBe(0.1);
    expect(invoice.taxBreakdown.taxAmount).toBeGreaterThan(0);
    expect(invoice.status).toBe('ISSUED');
  });

  it('computes financial metrics dashboard values', () => {
    const metrics = new FinancialReportingService().calculateMetrics({
      mrr: 125000,
      nrr: 112,
      churnRate: 6.2,
      ltv: 14500,
      cac: 3200,
      grossProfitMargin: 68.5,
      activeCustomers: 820,
    });

    expect(metrics.ltvToCacRatio).toBeGreaterThan(1);
    expect(metrics.grossProfitMargin).toBe(68.5);
    expect(metrics.activeCustomers).toBe(820);
  });
});
