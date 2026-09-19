import { randomBytes, randomUUID } from "node:crypto";
import type { IReferralRepository } from "./repository.js";
import {
  type AffiliateAccount,
  type ReferralAttribution,
  type CommissionLedgerEntry,
  type CreateAffiliateInput,
  type RecordAttributionInput,
  CreateAffiliateInputSchema,
  RecordAttributionInputSchema
} from "../schemas/referral-schemas.js";

export class ReferralService {
  constructor(private readonly repository: IReferralRepository) {}

  async createAffiliate(input: CreateAffiliateInput): Promise<AffiliateAccount> {
    const validated = CreateAffiliateInputSchema.parse(input);

    const existing = await this.repository.getAffiliateByCode(validated.referralCode, validated.tenantId);
    if (existing) {
      throw new Error(`Referral code '${validated.referralCode}' is already taken`);
    }

    const account: AffiliateAccount = {
      id: `aff_${Date.now()}_${randomBytes(4).toString("hex")}`,
      tenantId: validated.tenantId,
      userId: validated.userId,
      referralCode: validated.referralCode.toUpperCase(),
      commissionRatePercent: validated.commissionRatePercent,
      payoutEmail: validated.payoutEmail,
      payoutMethod: "STRIPE",
      isVerified: true,
      requiresMfaForPayoutChange: true,
      totalEarnedCents: 0,
      totalPaidCents: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.repository.saveAffiliate(account);
  }

  async updatePayoutDetails(
    affiliateId: string,
    payoutEmail: string,
    payoutMethod: "STRIPE" | "PAYPAL" | "WISE" | "MANUAL",
    mfaVerified: boolean
  ): Promise<AffiliateAccount> {
    const affiliate = await this.repository.getAffiliateById(affiliateId);
    if (!affiliate) throw new Error(`Affiliate '${affiliateId}' not found`);

    // Payout details mutation security
    if (affiliate.requiresMfaForPayoutChange && !mfaVerified) {
      throw new Error("MFA verification required to modify sensitive affiliate payout details");
    }

    affiliate.payoutEmail = payoutEmail;
    affiliate.payoutMethod = payoutMethod;
    affiliate.updatedAt = new Date();

    return this.repository.saveAffiliate(affiliate);
  }

  async recordAttribution(input: RecordAttributionInput): Promise<ReferralAttribution> {
    const validated = RecordAttributionInputSchema.parse(input);

    const affiliate = await this.repository.getAffiliateByCode(validated.referralCode, validated.tenantId);
    if (!affiliate) {
      throw new Error(`Invalid referral code '${validated.referralCode}'`);
    }

    // 1. Self-referral check by user ID
    let isFlaggedFraud = false;
    let fraudReason: string | undefined;

    if (validated.referredUserId && validated.referredUserId === affiliate.userId) {
      isFlaggedFraud = true;
      fraudReason = "SELF_REFERRAL_USER_ID_MATCH";
    }

    // 60-day attribution window
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const attribution: ReferralAttribution = {
      id: `attr_${Date.now()}_${randomBytes(4).toString("hex")}`,
      tenantId: validated.tenantId,
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      referredUserId: validated.referredUserId,
      visitorIp: validated.visitorIp,
      deviceFingerprint: validated.deviceFingerprint,
      paymentMethodFingerprint: validated.paymentMethodFingerprint,
      attributionModel: "LAST_TOUCH",
      attributedAt: new Date(),
      expiresAt,
      isFlaggedFraud,
      fraudReason
    };

    return this.repository.saveAttribution(attribution);
  }

  async recordConversion(
    attributionId: string,
    paymentId: string,
    amountCents: number
  ): Promise<CommissionLedgerEntry> {
    const attribution = await this.repository.getAttributionById(attributionId);
    if (!attribution) throw new Error(`Attribution '${attributionId}' not found`);

    if (attribution.isFlaggedFraud) {
      throw new Error(`Cannot award commission: Attribution flagged for fraud (${attribution.fraudReason})`);
    }

    if (new Date() > new Date(attribution.expiresAt)) {
      throw new Error("Attribution has expired");
    }

    const affiliate = await this.repository.getAffiliateById(attribution.affiliateId);
    if (!affiliate) throw new Error("Affiliate account not found");

    const commissionCents = Math.round(amountCents * (affiliate.commissionRatePercent / 100));

    const commission: CommissionLedgerEntry = {
      id: `comm_${Date.now()}_${randomBytes(4).toString("hex")}`,
      tenantId: attribution.tenantId,
      affiliateId: affiliate.id,
      attributionId: attribution.id,
      paymentId,
      amountCents,
      commissionCents,
      currency: "USD",
      status: "PENDING",
      createdAt: new Date()
    };

    affiliate.totalEarnedCents += commissionCents;
    await this.repository.saveAffiliate(affiliate);

    return this.repository.saveCommission(commission);
  }

  async approveCommission(commissionId: string): Promise<CommissionLedgerEntry> {
    const comm = await this.repository.getCommissionById(commissionId);
    if (!comm) throw new Error(`Commission '${commissionId}' not found`);

    comm.status = "APPROVED";
    comm.approvedAt = new Date();
    return this.repository.saveCommission(comm);
  }

  async markCommissionPaid(commissionId: string): Promise<CommissionLedgerEntry> {
    const comm = await this.repository.getCommissionById(commissionId);
    if (!comm) throw new Error(`Commission '${commissionId}' not found`);

    comm.status = "PAID";
    comm.paidAt = new Date();

    const affiliate = await this.repository.getAffiliateById(comm.affiliateId);
    if (affiliate) {
      affiliate.totalPaidCents += comm.commissionCents;
      await this.repository.saveAffiliate(affiliate);
    }

    return this.repository.saveCommission(comm);
  }

  async handleRefund(paymentId: string): Promise<CommissionLedgerEntry | null> {
    const comm = await this.repository.getCommissionByPaymentId(paymentId);
    if (!comm) return null;

    comm.status = "REVERSED";
    comm.reversedAt = new Date();
    comm.notes = "Transaction refunded by customer";

    const affiliate = await this.repository.getAffiliateById(comm.affiliateId);
    if (affiliate) {
      affiliate.totalEarnedCents = Math.max(0, affiliate.totalEarnedCents - comm.commissionCents);
      await this.repository.saveAffiliate(affiliate);
    }

    return this.repository.saveCommission(comm);
  }
}
