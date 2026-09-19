import {
  CreditBalance,
  LedgerEntry,
  Reservation,
  AutoRechargeConfig,
  MeterEventIngest,
  ReserveCreditsInput,
  SettleCreditsInput,
  ReleaseCreditsInput,
  AdminCorrectionInput,
} from "../schemas/metering-schemas.js";

export class MeteringClient {
  constructor(
    private baseUrl: string = "/api/metering",
    private headers: Record<string, string> = {}
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Metering API error: ${res.status}`);
    }

    return res.json();
  }

  async getBalance(tenantId: string): Promise<CreditBalance> {
    return this.request<CreditBalance>(`/balance?tenantId=${encodeURIComponent(tenantId)}`);
  }

  async getLedger(tenantId: string, limit?: number): Promise<LedgerEntry[]> {
    const q = limit ? `&limit=${limit}` : "";
    return this.request<LedgerEntry[]>(`/ledger?tenantId=${encodeURIComponent(tenantId)}${q}`);
  }

  async ingestUsage(event: MeterEventIngest): Promise<{ processed: boolean; ledgerEntry: LedgerEntry; balance: CreditBalance }> {
    return this.request("/ingest", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  async reserveCredits(input: ReserveCreditsInput): Promise<{ reservation: Reservation; remainingBalance: number }> {
    return this.request("/reserve", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async settleCredits(input: SettleCreditsInput): Promise<{ reservation: Reservation; balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    return this.request("/settle", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async releaseCredits(input: ReleaseCreditsInput): Promise<{ reservation: Reservation; balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    return this.request("/release", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getAutoRecharge(tenantId: string): Promise<AutoRechargeConfig | null> {
    return this.request<AutoRechargeConfig | null>(`/auto-recharge?tenantId=${encodeURIComponent(tenantId)}`);
  }

  async configureAutoRecharge(config: AutoRechargeConfig): Promise<AutoRechargeConfig> {
    return this.request<AutoRechargeConfig>("/auto-recharge", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  async adminCorrection(input: AdminCorrectionInput): Promise<{ balance: CreditBalance; ledgerEntry: LedgerEntry }> {
    return this.request("/admin/correction", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
