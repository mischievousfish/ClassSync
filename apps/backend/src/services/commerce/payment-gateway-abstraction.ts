export type PaymentProviderName = 'MOMO' | 'ZALOPAY' | 'VNPAY' | 'VIETQR' | 'STRIPE' | 'APPLE_IAP' | 'GOOGLE_PLAY';

export interface PaymentProviderInterface {
  providerName: PaymentProviderName;
  createPaymentSession(input: Record<string, unknown>): Promise<{ provider: PaymentProviderName; checkoutUrl?: string; paymentId: string; status: string }>;
  verifyWebhook(input: Record<string, unknown>): Promise<boolean>;
  refund(input: Record<string, unknown>): Promise<{ provider: PaymentProviderName; refunded: boolean; refundId?: string }>;
}

export interface PaymentGatewayContext {
  customerId: string;
  amount: number;
  currency: string;
  provider: PaymentProviderName;
  metadata?: Record<string, unknown>;
}

export class PaymentGatewayAbstraction {
  private readonly providers = new Map<PaymentProviderName, PaymentProviderInterface>();

  registerProvider(provider: PaymentProviderInterface): void {
    this.providers.set(provider.providerName, provider);
  }

  async createCheckoutSession(context: PaymentGatewayContext): Promise<{ provider: PaymentProviderName; checkoutUrl?: string; paymentId: string; status: string }> {
    const provider = this.providers.get(context.provider);
    if (!provider) throw new Error(`Unsupported payment provider: ${context.provider}`);

    return provider.createPaymentSession({
      customerId: context.customerId,
      amount: context.amount,
      currency: context.currency,
      metadata: context.metadata,
    });
  }

  async verifyWebhook(provider: PaymentProviderName, payload: Record<string, unknown>): Promise<boolean> {
    const gateway = this.providers.get(provider);
    if (!gateway) return false;
    return gateway.verifyWebhook(payload);
  }

  async refund(provider: PaymentProviderName, payload: Record<string, unknown>): Promise<{ provider: PaymentProviderName; refunded: boolean; refundId?: string }> {
    const gateway = this.providers.get(provider);
    if (!gateway) return { provider, refunded: false };
    return gateway.refund(payload);
  }
}

export class MockGateway implements PaymentProviderInterface {
  providerName: PaymentProviderName;

  constructor(providerName: PaymentProviderName) {
    this.providerName = providerName;
  }

  async createPaymentSession(input: Record<string, unknown>): Promise<{ provider: PaymentProviderName; checkoutUrl?: string; paymentId: string; status: string }> {
    return {
      provider: this.providerName,
      checkoutUrl: `https://example.com/${this.providerName.toLowerCase()}/checkout`,
      paymentId: `mock_${String(input.customerId ?? 'unknown')}_${Date.now()}`,
      status: 'PENDING',
    };
  }

  async verifyWebhook(_input: Record<string, unknown>): Promise<boolean> {
    return true;
  }

  async refund(_input: Record<string, unknown>): Promise<{ provider: PaymentProviderName; refunded: boolean; refundId?: string }> {
    return { provider: this.providerName, refunded: true, refundId: `${this.providerName}_refund_${Date.now()}` };
  }
}
