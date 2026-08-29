import { Request, Response } from 'express';
import { FinancialReportingService } from '../services/commerce/financial-reporting.service';
import { InAppPurchaseWebhookHandler } from '../services/commerce/in-app-purchase-webhook-handler';
import { PaymentGatewayAbstraction, MockGateway } from '../services/commerce/payment-gateway-abstraction';
import { SubscriptionManager } from '../services/commerce/subscription-manager';
import { EInvoiceService } from '../services/commerce/e-invoice.service';

export const subscriptionManager = new SubscriptionManager();
export const paymentGatewayAbstraction = new PaymentGatewayAbstraction();
export const financialReportingService = new FinancialReportingService();
export const iapWebhookHandler = new InAppPurchaseWebhookHandler();
export const eInvoiceService = new EInvoiceService();

['MOMO', 'ZALOPAY', 'VNPAY', 'STRIPE', 'APPLE_IAP', 'GOOGLE_PLAY', 'VIETQR'].forEach((provider) => {
  paymentGatewayAbstraction.registerProvider(new MockGateway(provider as any));
});

export async function createSubscriptionController(request: Request, response: Response): Promise<void> {
  const { customerId, orgId, plan, discountCode } = request.body as any;
  const subscription = subscriptionManager.createSubscription({ customerId, orgId, plan, discountCode });
  response.status(201).json({ subscription });
}

export async function usageBillingController(request: Request, response: Response): Promise<void> {
  const payload = request.body as any;
  const invoice = subscriptionManager.calculateUsageInvoice({
    orgId: payload.orgId,
    aiTokensUsed: Number(payload.aiTokensUsed ?? 0),
    znsMessagesUsed: Number(payload.znsMessagesUsed ?? 0),
    monthlyQuota: {
      aiTokens: Number(payload.monthlyQuota?.aiTokens ?? 0),
      znsMessages: Number(payload.monthlyQuota?.znsMessages ?? 0),
    },
    currency: payload.currency ?? 'USD',
    overageRate: payload.overageRate ?? { aiTokens: 0.002, znsMessages: 0.03 },
  });
  response.json({ invoice });
}

export async function paymentCheckoutController(request: Request, response: Response): Promise<void> {
  const { customerId, amount, currency, provider, metadata } = request.body as any;
  const session = await paymentGatewayAbstraction.createCheckoutSession({ customerId, amount, currency, provider, metadata });
  response.json({ session });
}

export async function appStoreWebhookController(request: Request, response: Response): Promise<void> {
  const result = await iapWebhookHandler.handleWebhook(request.body as any);
  response.json(result);
}

export async function invoiceController(request: Request, response: Response): Promise<void> {
  const payload = request.body as any;
  const invoice = eInvoiceService.issueInvoice({
    invoiceId: payload.invoiceId,
    customerName: payload.customerName,
    customerTaxCode: payload.customerTaxCode,
    provider: payload.provider ?? 'VNPT',
    currency: payload.currency ?? 'VND',
    subtotal: Number(payload.subtotal ?? 0),
    lines: payload.lines ?? [],
    customerCountry: payload.customerCountry ?? 'VN',
  });
  response.json({ invoice });
}

export async function financialMetricsController(_request: Request, response: Response): Promise<void> {
  const metrics = financialReportingService.calculateMetrics({
    mrr: 125000,
    nrr: 112,
    churnRate: 6.2,
    ltv: 14500,
    cac: 3200,
    grossProfitMargin: 68.5,
    activeCustomers: 820,
  });
  response.json({ metrics });
}
