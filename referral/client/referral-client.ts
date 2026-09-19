import type {
  AffiliateAccount,
  CreateAffiliateInput,
  CommissionLedgerEntry,
  ReferralAttribution
} from "../schemas/referral-schemas.js";

export interface ReferralClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class ReferralClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: ReferralClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/referral";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async getAccount(): Promise<AffiliateAccount | null> {
    const res = await this.fetchFn(`${this.baseUrl}/account`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to load affiliate account: ${res.statusText}`);
    return res.json();
  }

  async createAccount(input: CreateAffiliateInput): Promise<AffiliateAccount> {
    const res = await this.fetchFn(`${this.baseUrl}/account`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to create affiliate account: ${res.statusText}`);
    return res.json();
  }

  async listCommissions(): Promise<CommissionLedgerEntry[]> {
    const res = await this.fetchFn(`${this.baseUrl}/commissions`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to load commissions: ${res.statusText}`);
    return res.json();
  }

  async recordAttribution(referralCode: string): Promise<ReferralAttribution> {
    const res = await this.fetchFn(`${this.baseUrl}/attribution`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ referralCode })
    });
    if (!res.ok) throw new Error(`Failed to record attribution: ${res.statusText}`);
    return res.json();
  }
}
