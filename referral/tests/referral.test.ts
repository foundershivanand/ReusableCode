import { describe, it, expect, beforeEach } from "vitest";
import { ReferralService } from "../server/referral-service.js";
import { InMemoryReferralRepository } from "../server/repository.js";

describe("Module 20: Affiliate & Referral System", () => {
  let repository: InMemoryReferralRepository;
  let service: ReferralService;

  beforeEach(() => {
    repository = new InMemoryReferralRepository();
    service = new ReferralService(repository);
  });

  it("creates an affiliate account and prevents duplicate referral codes", async () => {
    const affiliate = await service.createAffiliate({
      tenantId: "t_1",
      userId: "u_affiliate",
      referralCode: "PARTNER20",
      payoutEmail: "partner@example.com",
      commissionRatePercent: 20
    });

    expect(affiliate.id).toBeDefined();
    expect(affiliate.referralCode).toBe("PARTNER20");
    expect(affiliate.totalEarnedCents).toBe(0);

    // Duplicate code must fail
    await expect(
      service.createAffiliate({
        tenantId: "t_1",
        userId: "u_other",
        referralCode: "partner20",
        payoutEmail: "other@example.com",
        commissionRatePercent: 20
      })
    ).rejects.toThrow(/already taken/);
  });

  it("requires MFA verification to modify sensitive payout details", async () => {
    const affiliate = await service.createAffiliate({
      tenantId: "t_1",
      userId: "u_aff",
      referralCode: "CODE10",
      payoutEmail: "original@example.com",
      commissionRatePercent: 10
    });

    // Attempting without MFA must fail
    await expect(
      service.updatePayoutDetails(affiliate.id, "hacker@evil.com", "STRIPE", false)
    ).rejects.toThrow(/MFA verification required/);

    // With MFA succeeds
    const updated = await service.updatePayoutDetails(
      affiliate.id,
      "verified@example.com",
      "WISE",
      true
    );
    expect(updated.payoutEmail).toBe("verified@example.com");
    expect(updated.payoutMethod).toBe("WISE");
  });

  it("flags self-referral attempts as fraud", async () => {
    await service.createAffiliate({
      tenantId: "t_1",
      userId: "u_alice",
      referralCode: "ALICE10",
      payoutEmail: "alice@example.com",
      commissionRatePercent: 15
    });

    // User attempts to use their own referral code
    const attr = await service.recordAttribution({
      tenantId: "t_1",
      referralCode: "ALICE10",
      referredUserId: "u_alice" // same user ID!
    });

    expect(attr.isFlaggedFraud).toBe(true);
    expect(attr.fraudReason).toBe("SELF_REFERRAL_USER_ID_MATCH");

    // Attempting conversion on fraud attribution must fail
    await expect(
      service.recordConversion(attr.id, "pay_123", 10000)
    ).rejects.toThrow(/Attribution flagged for fraud/);
  });

  it("tracks conversion, awards commission, and handles lifecycle states", async () => {
    const affiliate = await service.createAffiliate({
      tenantId: "t_1",
      userId: "u_bob",
      referralCode: "BOB20",
      payoutEmail: "bob@example.com",
      commissionRatePercent: 20
    });

    const attr = await service.recordAttribution({
      tenantId: "t_1",
      referralCode: "BOB20",
      referredUserId: "u_customer_1"
    });

    expect(attr.isFlaggedFraud).toBe(false);

    // Record $100.00 payment (10000 cents) -> $20.00 commission (2000 cents)
    const comm = await service.recordConversion(attr.id, "pay_invoice_001", 10000);
    expect(comm.commissionCents).toBe(2000);
    expect(comm.status).toBe("PENDING");

    // Check affiliate total earned
    const updatedAff = await repository.getAffiliateById(affiliate.id);
    expect(updatedAff?.totalEarnedCents).toBe(2000);

    // Lifecycle: Approve -> Paid
    const approved = await service.approveCommission(comm.id);
    expect(approved.status).toBe("APPROVED");

    const paid = await service.markCommissionPaid(comm.id);
    expect(paid.status).toBe("PAID");

    const finalAff = await repository.getAffiliateById(affiliate.id);
    expect(finalAff?.totalPaidCents).toBe(2000);
  });

  it("automatically reverses commission upon transaction refund", async () => {
    const affiliate = await service.createAffiliate({
      tenantId: "t_1",
      userId: "u_carol",
      referralCode: "CAROL25",
      payoutEmail: "carol@example.com",
      commissionRatePercent: 25
    });

    const attr = await service.recordAttribution({
      tenantId: "t_1",
      referralCode: "CAROL25",
      referredUserId: "u_refund_cust"
    });

    // $200 sale -> $50 commission
    await service.recordConversion(attr.id, "pay_refunded_1", 20000);

    const beforeRefundAff = await repository.getAffiliateById(affiliate.id);
    expect(beforeRefundAff?.totalEarnedCents).toBe(5000);

    // Customer requests refund
    const reversed = await service.handleRefund("pay_refunded_1");
    expect(reversed?.status).toBe("REVERSED");
    expect(reversed?.reversedAt).toBeDefined();

    // Affiliate total earned is reduced back to 0
    const afterRefundAff = await repository.getAffiliateById(affiliate.id);
    expect(afterRefundAff?.totalEarnedCents).toBe(0);
  });
});
