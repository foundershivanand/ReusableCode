import crypto from "node:crypto";
import {
  Currency,
  DisputeStatus,
  InvoiceLineItem,
  InvoiceStatus,
  PaymentStatus,
  Plan,
  RefundStatus,
  SubscriptionStatus,
} from "../schemas/billing-schemas.js";

export interface CustomerRecord {
  id: string; // e.g. "cust_123" or UUID
  email: string;
  name?: string | null;
  providerCustomerId?: string | null;
  provider?: string | null;
  createdAt: Date;
}

export interface SubscriptionRecord {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  provider: string;
  providerSubscriptionId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceRecord {
  id: string;
  customerId: string;
  subscriptionId: string | null;
  currency: Currency;
  subtotalMinorUnits: number;
  taxMinorUnits: number;
  discountMinorUnits: number;
  totalMinorUnits: number;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  invoicePdfUrl?: string;
  providerInvoiceId?: string;
  createdAt: Date;
  paidAt: Date | null;
}

export interface PaymentTransactionRecord {
  id: string;
  customerId: string;
  invoiceId: string | null;
  amountMinorUnits: number;
  currency: Currency;
  status: PaymentStatus;
  provider: string;
  providerPaymentId: string;
  idempotencyKey: string;
  createdAt: Date;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  customerId: string;
  amountMinorUnits: number;
  currency: Currency;
  status: RefundStatus;
  reason: string;
  providerRefundId?: string;
  idempotencyKey: string;
  createdAt: Date;
}

export interface DisputeRecord {
  id: string;
  paymentId: string;
  customerId: string;
  amountMinorUnits: number;
  currency: Currency;
  status: DisputeStatus;
  reason: string;
  providerDisputeId: string;
  createdAt: Date;
}

export interface ProcessedWebhookRecord {
  eventId: string; // Unique provider event id
  provider: string;
  eventType: string;
  providerTimestamp: Date;
  processedAt: Date;
  status: "PROCESSED" | "FAILED";
  failureReason?: string | null;
}

export interface CouponRecord {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  currency?: Currency;
  maxRedemptions: number | null;
  redemptionsCount: number;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface BillingRepository {
  // Customers
  createCustomer(customer: CustomerRecord): Promise<CustomerRecord>;
  findCustomerById(id: string): Promise<CustomerRecord | null>;
  findCustomerByEmail(email: string): Promise<CustomerRecord | null>;

  // Plans
  createPlan(plan: Plan): Promise<Plan>;
  findPlanById(id: string): Promise<Plan | null>;
  listActivePlans(): Promise<Plan[]>;

  // Subscriptions
  createSubscription(sub: Omit<SubscriptionRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<SubscriptionRecord>;
  findSubscriptionById(id: string): Promise<SubscriptionRecord | null>;
  findActiveSubscriptionByCustomerId(customerId: string): Promise<SubscriptionRecord | null>;
  findLatestSubscriptionByCustomerId(customerId: string): Promise<SubscriptionRecord | null>;
  updateSubscription(id: string, update: Partial<SubscriptionRecord>): Promise<SubscriptionRecord>;

  // Invoices
  createInvoice(invoice: Omit<InvoiceRecord, "id" | "createdAt"> & { id?: string }): Promise<InvoiceRecord>;
  findInvoiceById(id: string): Promise<InvoiceRecord | null>;
  findInvoicesByCustomerId(customerId: string): Promise<InvoiceRecord[]>;
  updateInvoice(id: string, update: Partial<InvoiceRecord>): Promise<InvoiceRecord>;

  // Payments
  createPayment(payment: Omit<PaymentTransactionRecord, "id" | "createdAt"> & { id?: string }): Promise<PaymentTransactionRecord>;
  findPaymentById(id: string): Promise<PaymentTransactionRecord | null>;
  findPaymentByIdempotencyKey(key: string): Promise<PaymentTransactionRecord | null>;
  findPaymentsByCustomerId(customerId: string): Promise<PaymentTransactionRecord[]>;
  updatePayment(id: string, update: Partial<PaymentTransactionRecord>): Promise<PaymentTransactionRecord>;

  // Refunds
  createRefund(refund: Omit<RefundRecord, "id" | "createdAt"> & { id?: string }): Promise<RefundRecord>;
  findRefundById(id: string): Promise<RefundRecord | null>;
  findRefundByIdempotencyKey(key: string): Promise<RefundRecord | null>;
  findRefundsByPaymentId(paymentId: string): Promise<RefundRecord[]>;

  // Disputes
  createDispute(dispute: Omit<DisputeRecord, "id" | "createdAt"> & { id?: string }): Promise<DisputeRecord>;
  findDisputeById(id: string): Promise<DisputeRecord | null>;
  findDisputesByCustomerId(customerId: string): Promise<DisputeRecord[]>;
  updateDispute(id: string, update: Partial<DisputeRecord>): Promise<DisputeRecord>;

  // Coupons
  createCoupon(coupon: CouponRecord): Promise<CouponRecord>;
  findCouponByCode(code: string): Promise<CouponRecord | null>;
  incrementCouponRedemption(code: string): Promise<void>;

  // Webhooks (Idempotency & Replay Protection)
  saveProcessedWebhook(record: ProcessedWebhookRecord): Promise<void>;
  findProcessedWebhook(provider: string, eventId: string): Promise<ProcessedWebhookRecord | null>;

  // Transactions
  withTransaction<T>(operation: (txRepo: BillingRepository) => Promise<T>): Promise<T>;
}

export class InMemoryBillingRepository implements BillingRepository {
  private customers: Map<string, CustomerRecord> = new Map();
  private plans: Map<string, Plan> = new Map();
  private subscriptions: Map<string, SubscriptionRecord> = new Map();
  private invoices: Map<string, InvoiceRecord> = new Map();
  private payments: Map<string, PaymentTransactionRecord> = new Map();
  private refunds: Map<string, RefundRecord> = new Map();
  private disputes: Map<string, DisputeRecord> = new Map();
  private coupons: Map<string, CouponRecord> = new Map();
  private webhooks: Map<string, ProcessedWebhookRecord> = new Map();

  async createCustomer(customer: CustomerRecord): Promise<CustomerRecord> {
    this.customers.set(customer.id, { ...customer });
    return { ...customer };
  }

  async findCustomerById(id: string): Promise<CustomerRecord | null> {
    const c = this.customers.get(id);
    return c ? { ...c } : null;
  }

  async findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
    const c = Array.from(this.customers.values()).find((item) => item.email.toLowerCase() === email.toLowerCase());
    return c ? { ...c } : null;
  }

  async createPlan(plan: Plan): Promise<Plan> {
    this.plans.set(plan.id, { ...plan });
    return { ...plan };
  }

  async findPlanById(id: string): Promise<Plan | null> {
    const p = this.plans.get(id);
    return p ? { ...p } : null;
  }

  async listActivePlans(): Promise<Plan[]> {
    return Array.from(this.plans.values())
      .filter((p) => p.isActive)
      .map((p) => ({ ...p }));
  }

  async createSubscription(data: Omit<SubscriptionRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<SubscriptionRecord> {
    const now = new Date();
    const sub: SubscriptionRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(sub.id, sub);
    return { ...sub };
  }

  async findSubscriptionById(id: string): Promise<SubscriptionRecord | null> {
    const s = this.subscriptions.get(id);
    return s ? { ...s } : null;
  }

  async findActiveSubscriptionByCustomerId(customerId: string): Promise<SubscriptionRecord | null> {
    const subs = Array.from(this.subscriptions.values()).filter(
      (s) =>
        s.customerId === customerId &&
        (s.status === "ACTIVE" ||
          s.status === "TRIALING" ||
          s.status === "PAST_DUE" ||
          s.status === "PAUSED")
    );
    subs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return subs[0] ? { ...subs[0] } : null;
  }

  async findLatestSubscriptionByCustomerId(customerId: string): Promise<SubscriptionRecord | null> {
    const subs = Array.from(this.subscriptions.values()).filter(
      (s) => s.customerId === customerId
    );
    subs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return subs[0] ? { ...subs[0] } : null;
  }

  async updateSubscription(id: string, update: Partial<SubscriptionRecord>): Promise<SubscriptionRecord> {
    const s = this.subscriptions.get(id);
    if (!s) throw new Error("Subscription not found");
    const updated: SubscriptionRecord = {
      ...s,
      ...update,
      version: s.version + 1,
      updatedAt: update.updatedAt || new Date(),
    };
    this.subscriptions.set(id, updated);
    return { ...updated };
  }

  async createInvoice(data: Omit<InvoiceRecord, "id" | "createdAt"> & { id?: string }): Promise<InvoiceRecord> {
    const inv: InvoiceRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.invoices.set(inv.id, inv);
    return { ...inv };
  }

  async findInvoiceById(id: string): Promise<InvoiceRecord | null> {
    const inv = this.invoices.get(id);
    return inv ? { ...inv } : null;
  }

  async findInvoicesByCustomerId(customerId: string): Promise<InvoiceRecord[]> {
    return Array.from(this.invoices.values())
      .filter((i) => i.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((i) => ({ ...i }));
  }

  async updateInvoice(id: string, update: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const inv = this.invoices.get(id);
    if (!inv) throw new Error("Invoice not found");
    const updated = { ...inv, ...update };
    this.invoices.set(id, updated);
    return { ...updated };
  }

  async createPayment(data: Omit<PaymentTransactionRecord, "id" | "createdAt"> & { id?: string }): Promise<PaymentTransactionRecord> {
    const existing = await this.findPaymentByIdempotencyKey(data.idempotencyKey);
    if (existing) return existing;

    const payment: PaymentTransactionRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.payments.set(payment.id, payment);
    return { ...payment };
  }

  async findPaymentById(id: string): Promise<PaymentTransactionRecord | null> {
    const p = this.payments.get(id);
    return p ? { ...p } : null;
  }

  async findPaymentByIdempotencyKey(key: string): Promise<PaymentTransactionRecord | null> {
    const p = Array.from(this.payments.values()).find((item) => item.idempotencyKey === key);
    return p ? { ...p } : null;
  }

  async findPaymentsByCustomerId(customerId: string): Promise<PaymentTransactionRecord[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => ({ ...p }));
  }

  async updatePayment(id: string, update: Partial<PaymentTransactionRecord>): Promise<PaymentTransactionRecord> {
    const p = this.payments.get(id);
    if (!p) throw new Error("Payment not found");
    const updated = { ...p, ...update };
    this.payments.set(id, updated);
    return { ...updated };
  }

  async createRefund(data: Omit<RefundRecord, "id" | "createdAt"> & { id?: string }): Promise<RefundRecord> {
    const existing = await this.findRefundByIdempotencyKey(data.idempotencyKey);
    if (existing) return existing;

    const refund: RefundRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.refunds.set(refund.id, refund);
    return { ...refund };
  }

  async findRefundById(id: string): Promise<RefundRecord | null> {
    const r = this.refunds.get(id);
    return r ? { ...r } : null;
  }

  async findRefundByIdempotencyKey(key: string): Promise<RefundRecord | null> {
    const r = Array.from(this.refunds.values()).find((item) => item.idempotencyKey === key);
    return r ? { ...r } : null;
  }

  async findRefundsByPaymentId(paymentId: string): Promise<RefundRecord[]> {
    return Array.from(this.refunds.values())
      .filter((r) => r.paymentId === paymentId)
      .map((r) => ({ ...r }));
  }

  async createDispute(data: Omit<DisputeRecord, "id" | "createdAt"> & { id?: string }): Promise<DisputeRecord> {
    const dispute: DisputeRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.disputes.set(dispute.id, dispute);
    return { ...dispute };
  }

  async findDisputeById(id: string): Promise<DisputeRecord | null> {
    const d = this.disputes.get(id);
    return d ? { ...d } : null;
  }

  async findDisputesByCustomerId(customerId: string): Promise<DisputeRecord[]> {
    return Array.from(this.disputes.values())
      .filter((d) => d.customerId === customerId)
      .map((d) => ({ ...d }));
  }

  async updateDispute(id: string, update: Partial<DisputeRecord>): Promise<DisputeRecord> {
    const d = this.disputes.get(id);
    if (!d) throw new Error("Dispute not found");
    const updated = { ...d, ...update };
    this.disputes.set(id, updated);
    return { ...updated };
  }

  async createCoupon(coupon: CouponRecord): Promise<CouponRecord> {
    this.coupons.set(coupon.code.toUpperCase(), { ...coupon, code: coupon.code.toUpperCase() });
    return { ...coupon };
  }

  async findCouponByCode(code: string): Promise<CouponRecord | null> {
    const c = this.coupons.get(code.toUpperCase());
    return c ? { ...c } : null;
  }

  async incrementCouponRedemption(code: string): Promise<void> {
    const c = this.coupons.get(code.toUpperCase());
    if (c) {
      c.redemptionsCount += 1;
      this.coupons.set(code.toUpperCase(), c);
    }
  }

  async saveProcessedWebhook(record: ProcessedWebhookRecord): Promise<void> {
    const key = `${record.provider}:${record.eventId}`;
    this.webhooks.set(key, { ...record });
  }

  async findProcessedWebhook(provider: string, eventId: string): Promise<ProcessedWebhookRecord | null> {
    const key = `${provider}:${eventId}`;
    const w = this.webhooks.get(key);
    return w ? { ...w } : null;
  }

  async withTransaction<T>(operation: (txRepo: BillingRepository) => Promise<T>): Promise<T> {
    return operation(this);
  }
}
