import type {
  AffiliateAccount,
  ReferralAttribution,
  CommissionLedgerEntry
} from "../schemas/referral-schemas.js";

export interface IReferralRepository {
  saveAffiliate(account: AffiliateAccount): Promise<AffiliateAccount>;
  getAffiliateById(id: string): Promise<AffiliateAccount | null>;
  getAffiliateByCode(code: string, tenantId: string): Promise<AffiliateAccount | null>;
  listAffiliates(tenantId: string): Promise<AffiliateAccount[]>;

  saveAttribution(attr: ReferralAttribution): Promise<ReferralAttribution>;
  getAttributionById(id: string): Promise<ReferralAttribution | null>;
  findAttributionByUser(referredUserId: string, tenantId: string): Promise<ReferralAttribution | null>;

  saveCommission(entry: CommissionLedgerEntry): Promise<CommissionLedgerEntry>;
  getCommissionById(id: string): Promise<CommissionLedgerEntry | null>;
  getCommissionByPaymentId(paymentId: string): Promise<CommissionLedgerEntry | null>;
  listCommissions(affiliateId?: string, tenantId?: string): Promise<CommissionLedgerEntry[]>;
}

export class InMemoryReferralRepository implements IReferralRepository {
  private affiliates: Map<string, AffiliateAccount> = new Map();
  private attributions: Map<string, ReferralAttribution> = new Map();
  private commissions: Map<string, CommissionLedgerEntry> = new Map();

  async saveAffiliate(account: AffiliateAccount): Promise<AffiliateAccount> {
    this.affiliates.set(account.id, JSON.parse(JSON.stringify(account)));
    return account;
  }

  async getAffiliateById(id: string): Promise<AffiliateAccount | null> {
    const a = this.affiliates.get(id);
    return a ? JSON.parse(JSON.stringify(a)) : null;
  }

  async getAffiliateByCode(code: string, tenantId: string): Promise<AffiliateAccount | null> {
    for (const a of this.affiliates.values()) {
      if (a.referralCode.toLowerCase() === code.toLowerCase() && a.tenantId === tenantId) {
        return JSON.parse(JSON.stringify(a));
      }
    }
    return null;
  }

  async listAffiliates(tenantId: string): Promise<AffiliateAccount[]> {
    return Array.from(this.affiliates.values())
      .filter((a) => a.tenantId === tenantId)
      .map((a) => JSON.parse(JSON.stringify(a)));
  }

  async saveAttribution(attr: ReferralAttribution): Promise<ReferralAttribution> {
    this.attributions.set(attr.id, JSON.parse(JSON.stringify(attr)));
    return attr;
  }

  async getAttributionById(id: string): Promise<ReferralAttribution | null> {
    const at = this.attributions.get(id);
    return at ? JSON.parse(JSON.stringify(at)) : null;
  }

  async findAttributionByUser(
    referredUserId: string,
    tenantId: string
  ): Promise<ReferralAttribution | null> {
    for (const at of this.attributions.values()) {
      if (at.referredUserId === referredUserId && at.tenantId === tenantId) {
        return JSON.parse(JSON.stringify(at));
      }
    }
    return null;
  }

  async saveCommission(entry: CommissionLedgerEntry): Promise<CommissionLedgerEntry> {
    this.commissions.set(entry.id, JSON.parse(JSON.stringify(entry)));
    return entry;
  }

  async getCommissionById(id: string): Promise<CommissionLedgerEntry | null> {
    const c = this.commissions.get(id);
    return c ? JSON.parse(JSON.stringify(c)) : null;
  }

  async getCommissionByPaymentId(paymentId: string): Promise<CommissionLedgerEntry | null> {
    for (const c of this.commissions.values()) {
      if (c.paymentId === paymentId) {
        return JSON.parse(JSON.stringify(c));
      }
    }
    return null;
  }

  async listCommissions(affiliateId?: string, tenantId?: string): Promise<CommissionLedgerEntry[]> {
    let list = Array.from(this.commissions.values());
    if (affiliateId) list = list.filter((c) => c.affiliateId === affiliateId);
    if (tenantId) list = list.filter((c) => c.tenantId === tenantId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
