export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'PAST_DUE';
export type PlanTier = 'FREEMIUM' | 'PRO' | 'ENTERPRISE' | 'RESELLER';

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  basePrice: number;
  currency: string;
  trialDays?: number;
}

export interface SubscriptionRecord {
  id: string;
  customerId: string;
  orgId?: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currency: string;
  amount: number;
  discountCode?: string;
  discountAmount: number;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
}

export interface UsageInvoiceInput {
  orgId: string;
  aiTokensUsed: number;
  znsMessagesUsed: number;
  monthlyQuota: { aiTokens: number; znsMessages: number };
  currency?: string;
  overageRate?: { aiTokens: number; znsMessages: number };
}

export interface UsageInvoiceResult {
  orgId: string;
  currency: string;
  aiTokensOverage: number;
  znsMessagesOverage: number;
  aiInvoiceAmount: number;
  znsInvoiceAmount: number;
  totalAmount: number;
  shouldInvoice: boolean;
}

export class SubscriptionManager {
  private readonly subscriptions = new Map<string, SubscriptionRecord>();

  createSubscription(input: {
    customerId: string;
    orgId?: string;
    plan: SubscriptionPlan;
    discountCode?: string;
  }): SubscriptionRecord {
    const discountAmount = this.applyDiscountAmount(input.plan.basePrice, input.discountCode);
    const trialEndsAt = input.plan.trialDays ? new Date(Date.now() + input.plan.trialDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = this.addBillingCycle(currentPeriodStart, input.plan.billingCycle);

    const record: SubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      customerId: input.customerId,
      orgId: input.orgId,
      planId: input.plan.id,
      status: input.plan.trialDays ? 'TRIAL' : 'ACTIVE',
      billingCycle: input.plan.billingCycle,
      currency: input.plan.currency,
      amount: input.plan.basePrice,
      discountCode: input.discountCode,
      discountAmount,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
    };

    this.subscriptions.set(record.id, record);
    return record;
  }

  getSubscription(id: string): SubscriptionRecord | undefined {
    return this.subscriptions.get(id);
  }

  upgradeSubscription(id: string, nextPlan: SubscriptionPlan): SubscriptionRecord {
    const current = this.subscriptions.get(id);
    if (!current) throw new Error('subscription not found');

    current.planId = nextPlan.id;
    current.billingCycle = nextPlan.billingCycle;
    current.amount = nextPlan.basePrice;
    current.status = 'ACTIVE';
    current.currentPeriodStart = new Date().toISOString();
    current.currentPeriodEnd = this.addBillingCycle(current.currentPeriodStart, nextPlan.billingCycle);
    return current;
  }

  downgradeSubscription(id: string, nextPlan: SubscriptionPlan): SubscriptionRecord {
    const current = this.subscriptions.get(id);
    if (!current) throw new Error('subscription not found');

    current.planId = nextPlan.id;
    current.billingCycle = nextPlan.billingCycle;
    current.amount = nextPlan.basePrice;
    current.status = 'ACTIVE';
    current.currentPeriodStart = new Date().toISOString();
    current.currentPeriodEnd = this.addBillingCycle(current.currentPeriodStart, nextPlan.billingCycle);
    return current;
  }

  cancelSubscription(id: string): SubscriptionRecord {
    const current = this.subscriptions.get(id);
    if (!current) throw new Error('subscription not found');

    current.status = 'CANCELLED';
    current.cancelledAt = new Date().toISOString();
    return current;
  }

  calculateUsageInvoice(input: UsageInvoiceInput): UsageInvoiceResult {
    const currency = input.currency ?? 'USD';
    const aiRate = input.overageRate?.aiTokens ?? 0.002;
    const znsRate = input.overageRate?.znsMessages ?? 0.03;

    const aiTokensOverage = Math.max(0, input.aiTokensUsed - input.monthlyQuota.aiTokens);
    const znsMessagesOverage = Math.max(0, input.znsMessagesUsed - input.monthlyQuota.znsMessages);
    const aiInvoiceAmount = aiTokensOverage * aiRate;
    const znsInvoiceAmount = znsMessagesOverage * znsRate;
    const totalAmount = aiInvoiceAmount + znsInvoiceAmount;

    return {
      orgId: input.orgId,
      currency,
      aiTokensOverage,
      znsMessagesOverage,
      aiInvoiceAmount: Number(aiInvoiceAmount.toFixed(2)),
      znsInvoiceAmount: Number(znsInvoiceAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      shouldInvoice: aiTokensOverage > 0 || znsMessagesOverage > 0,
    };
  }

  private addBillingCycle(value: string, cycle: BillingCycle): string {
    const date = new Date(value);
    if (cycle === 'MONTHLY') date.setMonth(date.getMonth() + 1);
    if (cycle === 'QUARTERLY') date.setMonth(date.getMonth() + 3);
    if (cycle === 'ANNUAL') date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  private applyDiscountAmount(basePrice: number, discountCode?: string): number {
    if (!discountCode) return 0;
    const normalized = discountCode.toUpperCase();
    if (normalized === 'SAVE10') return basePrice * 0.1;
    if (normalized === 'SAVE20') return basePrice * 0.2;
    if (normalized === 'NEWUSER') return basePrice * 0.15;
    return 0;
  }
}
