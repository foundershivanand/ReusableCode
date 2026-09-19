import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryMeteringRepository,
  MeteringService,
} from "../server/index.js";
import { MockPaymentProviderAdapter } from "../providers/index.js";

describe("Module 21: Metering & Credit System", () => {
  let repo: InMemoryMeteringRepository;
  let paymentProvider: MockPaymentProviderAdapter;
  let service: MeteringService;
  const tenantId = "tenant_test_123";

  beforeEach(() => {
    repo = new InMemoryMeteringRepository();
    paymentProvider = new MockPaymentProviderAdapter();
    service = new MeteringService(repo, paymentProvider);
  });

  it("should initialize zero balance for new tenant and grant credits", async () => {
    const bal = await service.getOrCreateBalance(tenantId);
    expect(bal.availableBalance).toBe(0);
    expect(bal.reservedBalance).toBe(0);

    const { grant, balance, ledgerEntry } = await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Initial welcome grant",
      idempotencyKey: "grant-key-1",
    });

    expect(grant.amount).toBe(100);
    expect(balance.availableBalance).toBe(100);
    expect(ledgerEntry.entryType).toBe("CREDIT_PURCHASE");
    expect(ledgerEntry.amount).toBe(100);
    expect(ledgerEntry.balanceAfter).toBe(100);

    // Test idempotency of grant
    const duplicate = await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Initial welcome grant",
      idempotencyKey: "grant-key-1",
    });
    expect(duplicate.balance.availableBalance).toBe(100);
  });

  it("should reserve credits, settle with partial usage, and refund remaining reserve", async () => {
    await service.grantCredits({
      tenantId,
      amount: 200,
      reason: "Test funding",
    });

    // Reserve 50 credits
    const { reservation, remainingBalance } = await service.reserveCredits({
      tenantId,
      operationId: "op-ai-generate",
      estimatedAmount: 50,
      ttlSeconds: 60,
    });

    expect(reservation.status).toBe("PENDING");
    expect(remainingBalance).toBe(150);

    const balAfterReserve = await service.getOrCreateBalance(tenantId);
    expect(balAfterReserve.availableBalance).toBe(150);
    expect(balAfterReserve.reservedBalance).toBe(50);

    // Settle with actual usage of only 30 credits (20 refunded to available)
    const { reservation: settledRes, balance: settledBal } = await service.settleCredits({
      reservationId: reservation.id,
      actualAmount: 30,
      pricingVersion: "v2-promo",
    });

    expect(settledRes.status).toBe("SETTLED");
    expect(settledRes.actualAmount).toBe(30);
    expect(settledBal.availableBalance).toBe(170); // 150 + 20 refund
    expect(settledBal.reservedBalance).toBe(0);
    expect(settledBal.lifetimeConsumed).toBe(30);
  });

  it("should release reserved credits on failed operation", async () => {
    await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Test funding",
    });

    const { reservation } = await service.reserveCredits({
      tenantId,
      operationId: "op-failed-task",
      estimatedAmount: 40,
    });

    const { reservation: releasedRes, balance } = await service.releaseCredits({
      reservationId: reservation.id,
      reason: "Task failed due to upstream network error",
    });

    expect(releasedRes.status).toBe("RELEASED");
    expect(balance.availableBalance).toBe(100);
    expect(balance.reservedBalance).toBe(0);
  });

  it("should prevent double-spending in concurrent reservations", async () => {
    await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Test funding",
    });

    // Two simultaneous requests to reserve 80 credits each
    const req1 = service.reserveCredits({
      tenantId,
      operationId: "op-concurrent-1",
      estimatedAmount: 80,
    });

    const req2 = service.reserveCredits({
      tenantId,
      operationId: "op-concurrent-2",
      estimatedAmount: 80,
    });

    const results = await Promise.allSettled([req1, req2]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toContain("Insufficient credits");
  });

  it("should ingest usage events idempotently and preserve pricing version", async () => {
    await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Test funding",
    });

    const ingest1 = await service.ingestUsageEvent({
      tenantId,
      idempotencyKey: "evt-api-call-101",
      eventType: "api_call",
      quantity: 5,
      unitCostCredits: 2,
      pricingVersion: "v1.2",
      metadata: { endpoint: "/v1/search" },
      timestamp: new Date().toISOString(),
    });

    expect(ingest1.processed).toBe(true);
    expect(ingest1.balance.availableBalance).toBe(90);
    expect(ingest1.ledgerEntry.pricingVersion).toBe("v1.2");

    // Re-sending same event with same idempotency key
    const ingest2 = await service.ingestUsageEvent({
      tenantId,
      idempotencyKey: "evt-api-call-101",
      eventType: "api_call",
      quantity: 5,
      unitCostCredits: 2,
      pricingVersion: "v1.2",
      metadata: { endpoint: "/v1/search" },
      timestamp: new Date().toISOString(),
    });

    expect(ingest2.processed).toBe(false);
    expect(ingest2.balance.availableBalance).toBe(90); // Not debited again
  });

  it("should expire credits correctly when grant expires", async () => {
    // Grant credits that expired 1 hour ago
    await service.grantCredits({
      tenantId,
      amount: 50,
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
      reason: "Expired promo grant",
    });

    // Grant credits that are valid
    await service.grantCredits({
      tenantId,
      amount: 100,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      reason: "Valid grant",
    });

    const expiredCount = await service.expireCredits(tenantId);
    expect(expiredCount).toBe(50);

    const bal = await service.getOrCreateBalance(tenantId);
    expect(bal.availableBalance).toBe(100);
  });

  it("should require reason and admin user for admin corrections", async () => {
    await service.grantCredits({
      tenantId,
      amount: 100,
      reason: "Funding",
    });

    await expect(
      service.adminCorrection({
        tenantId,
        amount: 25,
        reason: "sh", // too short
        adminUserId: "admin-1",
      })
    ).rejects.toThrow("at least 5 characters");

    const result = await service.adminCorrection({
      tenantId,
      amount: -20,
      reason: "Service outage credit adjustment refund",
      adminUserId: "admin-1",
    });

    expect(result.balance.availableBalance).toBe(80);
    expect(result.ledgerEntry.entryType).toBe("ADMIN_CORRECTION");
  });

  it("should trigger auto-recharge when balance drops below threshold", async () => {
    await service.grantCredits({
      tenantId,
      amount: 150,
      reason: "Starting balance",
    });

    await service.configureAutoRecharge({
      tenantId,
      enabled: true,
      thresholdBalance: 100,
      rechargeAmount: 500,
      maxMonthlyRecharges: 3,
      currentMonthlyCount: 0,
      paymentMethodId: "pm_card_valid",
      updatedAt: new Date().toISOString(),
    });

    // Ingest usage that drops balance from 150 to 90 (below threshold 100)
    await service.ingestUsageEvent({
      tenantId,
      idempotencyKey: "evt-drop-threshold",
      eventType: "compute_units",
      quantity: 60,
      unitCostCredits: 1,
      pricingVersion: "v1",
      metadata: {},
      timestamp: new Date().toISOString(),
    });

    // Balance should be 90 + 500 (recharged) = 590
    const bal = await service.getOrCreateBalance(tenantId);
    expect(bal.availableBalance).toBe(590);

    const config = await repo.getAutoRechargeConfig(tenantId);
    expect(config?.currentMonthlyCount).toBe(1);
  });
});
