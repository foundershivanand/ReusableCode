import type {
  AffiliateAccount,
  ReferralAttribution,
  CommissionLedgerEntry
} from "../schemas/referral-schemas.js";

export interface IReferralProvider {
  name: string;
  createAffiliate(account: AffiliateAccount): Promise<AffiliateAccount>;
  trackConversion(attribution: ReferralAttribution, amountCents: number): Promise<CommissionLedgerEntry>;
  handleRefund?(paymentId: string): Promise<void>;
}

export class InternalReferralAdapter implements IReferralProvider {
  public name = "INTERNAL";

  async createAffiliate(account: AffiliateAccount): Promise<AffiliateAccount> {
    return account;
  }

  async trackConversion(attribution: ReferralAttribution, amountCents: number): Promise<CommissionLedgerEntry> {
    const commissionCents = Math.round(amountCents * 0.2); // 20%
    return {
      id: `comm_${Date.now()}`,
      tenantId: attribution.tenantId,
      affiliateId: attribution.affiliateId,
      attributionId: attribution.id,
      paymentId: `pay_${Date.now()}`,
      amountCents,
      commissionCents,
      currency: "USD",
      status: "PENDING",
      createdAt: new Date()
    };
  }
}

export class RewardfulAdapter implements IReferralProvider {
  public name = "REWARDFUL";
  constructor(public apiKey: string) {}

  async createAffiliate(account: AffiliateAccount): Promise<AffiliateAccount> {
    return account;
  }

  async trackConversion(attribution: ReferralAttribution, amountCents: number): Promise<CommissionLedgerEntry> {
    return {
      id: `rewardful_${Date.now()}`,
      tenantId: attribution.tenantId,
      affiliateId: attribution.affiliateId,
      attributionId: attribution.id,
      paymentId: `pay_${Date.now()}`,
      amountCents,
      commissionCents: Math.round(amountCents * 0.2),
      currency: "USD",
      status: "PENDING",
      createdAt: new Date()
    };
  }
}

export class FirstPromoterAdapter implements IReferralProvider {
  public name = "FIRSTPROMOTER";
  constructor(public apiKey: string) {}

  async createAffiliate(account: AffiliateAccount): Promise<AffiliateAccount> {
    return account;
  }

  async trackConversion(attribution: ReferralAttribution, amountCents: number): Promise<CommissionLedgerEntry> {
    return {
      id: `fp_${Date.now()}`,
      tenantId: attribution.tenantId,
      affiliateId: attribution.affiliateId,
      attributionId: attribution.id,
      paymentId: `pay_${Date.now()}`,
      amountCents,
      commissionCents: Math.round(amountCents * 0.2),
      currency: "USD",
      status: "PENDING",
      createdAt: new Date()
    };
  }
}
