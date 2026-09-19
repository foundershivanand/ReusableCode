import { describe, expect, it } from "vitest";
import { BillingService } from "../server/billing-service.js";
import { InMemoryBillingRepository } from "../server/repository.js";

describe("Refund Consistency & Entitlement Invalidation (Page 16)", () => {
  async function setup() {
    const repo = new InMemoryBillingRepository();
    const billing = new BillingService(repo);

    // Create customer & payment
    await repo.createCustomer({
      id: "cust_refund",
      email: "refund@example.com",
      createdAt: new Date(),
    });

    const invoice = await repo.createInvoice({
      customerId: "cust_refund",
      subscriptionId: null,
      currency: "USD",
      subtotalMinorUnits: 10000,
      taxMinorUnits: 0,
      discountMinorUnits: 0,
      totalMinorUnits: 10000,
      status: "PAID",
      lineItems: [{ description: "Annual Plan", amountMinorUnits: 10000, quantity: 1, taxRatePercent: 0, taxAmountMinorUnits: 0 }],
      paidAt: new Date(),
    });

    const payment = await repo.createPayment({
      customerId: "cust_refund",
      invoiceId: invoice.id,
      amountMinorUnits: 10000,
      currency: "USD",
      status: "SUCCEEDED",
      provider: "stripe",
      providerPaymentId: "ch_12345",
      idempotencyKey: "pay_idem_1",
    });

    // Create active subscription
    await repo.createSubscription({
      customerId: "cust_refund",
      planId: "annual_pro",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      provider: "stripe",
      providerSubscriptionId: "sub_refund_test",
      version: 1,
    });

    return { repo, billing, payment, invoice };
  }

  it("updates payment state, invoice state, and revokes entitlement on full refund", async () => {
    const { billing, repo, payment, invoice } = await setup();

    // Execute full refund
    const refund = await billing.processRefund({
      paymentId: payment.id,
      idempotencyKey: "ref_idem_1",
      reason: "requested_by_customer",
    });

    expect(refund.status).toBe("SUCCEEDED");
    expect(refund.amountMinorUnits).toBe(10000);

    // 1. Payment state is REFUNDED
    const updatedPayment = await repo.findPaymentById(payment.id);
    expect(updatedPayment?.status).toBe("REFUNDED");

    // 2. Invoice state is VOID
    const updatedInvoice = await repo.findInvoiceById(invoice.id);
    expect(updatedInvoice?.status).toBe("VOID");

    // 3. Entitlement is revoked (Subscription canceled)
    const sub = await repo.findActiveSubscriptionByCustomerId("cust_refund");
    expect(sub).toBeNull();
  });

  it("updates payment state to PARTIALLY_REFUNDED and preserves invoice on partial refund", async () => {
    const { billing, repo, payment, invoice } = await setup();

    // Refund $20 of $100
    const refund = await billing.processRefund({
      paymentId: payment.id,
      amountMinorUnits: 2000,
      idempotencyKey: "ref_partial_1",
      reason: "requested_by_customer",
    });

    expect(refund.amountMinorUnits).toBe(2000);

    const updatedPayment = await repo.findPaymentById(payment.id);
    expect(updatedPayment?.status).toBe("PARTIALLY_REFUNDED");

    const updatedInvoice = await repo.findInvoiceById(invoice.id);
    expect(updatedInvoice?.status).toBe("PAID");

    // Subscription remains active
    const sub = await repo.findActiveSubscriptionByCustomerId("cust_refund");
    expect(sub?.status).toBe("ACTIVE");
  });
});
