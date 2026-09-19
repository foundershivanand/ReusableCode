import { describe, expect, it } from "vitest";
import { DefaultTaxProvider } from "../server/tax-engine.js";
import { Money } from "../server/money.js";
import { InMemoryBillingRepository } from "../server/repository.js";
import { BillingService } from "../server/billing-service.js";

describe("Tax Engine & Price Immutability (Page 15-16)", () => {
  it("calculates tax-exclusive and tax-inclusive amounts correctly", async () => {
    const taxProvider = new DefaultTaxProvider();
    const amount = new Money(10000, "USD"); // $100.00

    // 1. Tax-exclusive in US (8.25%)
    const resExclusive = await taxProvider.calculateTax({
      amount,
      billingAddress: { line1: "123 St", city: "SF", postalCode: "94105", country: "US" },
      isTaxInclusive: false,
    });
    expect(resExclusive.taxRatePercent).toBe(8.25);
    expect(resExclusive.taxAmount.minorUnits).toBe(825);
    expect(resExclusive.total.minorUnits).toBe(10825);

    // 2. Tax-inclusive in Germany (19%)
    const eurAmount = new Money(11900, "EUR"); // €119.00 inclusive
    const resInclusive = await taxProvider.calculateTax({
      amount: eurAmount,
      billingAddress: { line1: "Main St", city: "Berlin", postalCode: "10115", country: "DE" },
      isTaxInclusive: true,
    });
    expect(resInclusive.total.minorUnits).toBe(11900);
    expect(resInclusive.subtotal.minorUnits).toBe(10000);
    expect(resInclusive.taxAmount.minorUnits).toBe(1900);
  });

  it("handles tax exemptions when a valid tax ID is provided", async () => {
    const taxProvider = new DefaultTaxProvider();
    const amount = new Money(10000, "EUR");

    const res = await taxProvider.calculateTax({
      amount,
      billingAddress: { line1: "123 St", city: "Dublin", postalCode: "D01", country: "IE" },
      taxId: "IE1234567T",
      isTaxInclusive: false,
    });

    expect(res.isTaxExempt).toBe(true);
    expect(res.taxAmount.minorUnits).toBe(0);
    expect(res.total.minorUnits).toBe(10000);
  });

  it("enforces price immutability: old invoices retain historical prices when plan prices change", async () => {
    const repo = new InMemoryBillingRepository();
    const billing = new BillingService(repo);

    // Register plan at $20.00
    await billing.registerPlan({
      id: "plan_tier1",
      name: "Tier 1",
      amountMinorUnits: 2000,
      currency: "USD",
      interval: "month",
      trialDays: 0,
      features: ["feat_1"],
      limits: {},
      isActive: true,
    });

    // Customer purchases at $20.00
    await billing.createCheckout({
      planId: "plan_tier1",
      customerId: "cust_historical",
      successUrl: "https://app.com/success",
      cancelUrl: "https://app.com/cancel",
    });

    const initialInvoices = await billing.listCustomerInvoices("cust_historical");
    expect(initialInvoices[0].subtotalMinorUnits).toBe(2000);

    // Plan price increases to $50.00 later
    await repo.createPlan({
      id: "plan_tier1",
      name: "Tier 1",
      amountMinorUnits: 5000, // Updated price!
      currency: "USD",
      interval: "month",
      trialDays: 0,
      features: ["feat_1"],
      limits: {},
      isActive: true,
    });

    // Querying old invoice must STILL show $20.00 (Price Immutability!)
    const oldInvoice = await repo.findInvoiceById(initialInvoices[0].id);
    expect(oldInvoice?.subtotalMinorUnits).toBe(2000);
    expect(oldInvoice?.lineItems[0].amountMinorUnits).toBe(2000);
  });
});
