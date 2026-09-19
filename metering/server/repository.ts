import {
  CreditBalance,
  CreditGrant,
  LedgerEntry,
  Reservation,
  AutoRechargeConfig,
  MeterEventIngest,
  UsageAlert,
} from "../schemas/metering-schemas.js";

export interface MeteringRepository {
  getBalance(tenantId: string): Promise<CreditBalance | null>;
  saveBalance(balance: CreditBalance): Promise<void>;
  createCreditGrant(grant: CreditGrant): Promise<CreditGrant>;
  getActiveGrants(tenantId: string): Promise<CreditGrant[]>;
  updateCreditGrant(grant: CreditGrant): Promise<void>;
  appendLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry>;
  getLedgerEntries(tenantId: string, limit?: number): Promise<LedgerEntry[]>;
  getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerEntry | null>;
  createReservation(res: Reservation): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | null>;
  updateReservation(res: Reservation): Promise<void>;
  getAutoRechargeConfig(tenantId: string): Promise<AutoRechargeConfig | null>;
  saveAutoRechargeConfig(config: AutoRechargeConfig): Promise<void>;
  recordUsageEvent(event: MeterEventIngest): Promise<boolean>;
  getUsageAlerts(tenantId: string): Promise<UsageAlert[]>;
  saveUsageAlert(alert: UsageAlert): Promise<void>;
}

export class InMemoryMeteringRepository implements MeteringRepository {
  private balances = new Map<string, CreditBalance>();
  private creditGrants = new Map<string, CreditGrant>();
  private ledgerEntries: LedgerEntry[] = [];
  private reservations = new Map<string, Reservation>();
  private autoRechargeConfigs = new Map<string, AutoRechargeConfig>();
  private usageEventKeys = new Set<string>();
  private usageAlerts: UsageAlert[] = [];

  async getBalance(tenantId: string): Promise<CreditBalance | null> {
    const b = this.balances.get(tenantId);
    return b ? { ...b } : null;
  }

  async saveBalance(balance: CreditBalance): Promise<void> {
    this.balances.set(balance.tenantId, { ...balance });
  }

  async createCreditGrant(grant: CreditGrant): Promise<CreditGrant> {
    this.creditGrants.set(grant.id, { ...grant });
    return { ...grant };
  }

  async getActiveGrants(tenantId: string): Promise<CreditGrant[]> {
    return Array.from(this.creditGrants.values())
      .filter(
        (g) =>
          g.tenantId === tenantId &&
          g.remainingAmount > 0
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.expiresAt && b.expiresAt) {
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        if (a.expiresAt) return -1;
        if (b.expiresAt) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async updateCreditGrant(grant: CreditGrant): Promise<void> {
    this.creditGrants.set(grant.id, { ...grant });
  }

  async appendLedgerEntry(entry: LedgerEntry): Promise<LedgerEntry> {
    if (entry.idempotencyKey) {
      const existing = this.ledgerEntries.find(
        (e) => e.idempotencyKey === entry.idempotencyKey
      );
      if (existing) {
        return { ...existing };
      }
    }
    this.ledgerEntries.push({ ...entry });
    return { ...entry };
  }

  async getLedgerEntries(tenantId: string, limit: number = 50): Promise<LedgerEntry[]> {
    return this.ledgerEntries
      .filter((e) => e.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((e) => ({ ...e }));
  }

  async getLedgerEntryByIdempotencyKey(key: string): Promise<LedgerEntry | null> {
    const found = this.ledgerEntries.find((e) => e.idempotencyKey === key);
    return found ? { ...found } : null;
  }

  async createReservation(res: Reservation): Promise<Reservation> {
    this.reservations.set(res.id, { ...res });
    return { ...res };
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const r = this.reservations.get(id);
    return r ? { ...r } : null;
  }

  async updateReservation(res: Reservation): Promise<void> {
    this.reservations.set(res.id, { ...res });
  }

  async getAutoRechargeConfig(tenantId: string): Promise<AutoRechargeConfig | null> {
    const cfg = this.autoRechargeConfigs.get(tenantId);
    return cfg ? { ...cfg } : null;
  }

  async saveAutoRechargeConfig(config: AutoRechargeConfig): Promise<void> {
    this.autoRechargeConfigs.set(config.tenantId, { ...config });
  }

  async recordUsageEvent(event: MeterEventIngest): Promise<boolean> {
    if (this.usageEventKeys.has(event.idempotencyKey)) {
      return false; // already processed
    }
    this.usageEventKeys.add(event.idempotencyKey);
    return true;
  }

  async getUsageAlerts(tenantId: string): Promise<UsageAlert[]> {
    return this.usageAlerts.filter((a) => a.tenantId === tenantId);
  }

  async saveUsageAlert(alert: UsageAlert): Promise<void> {
    const idx = this.usageAlerts.findIndex(
      (a) => a.tenantId === alert.tenantId && a.thresholdPercent === alert.thresholdPercent
    );
    if (idx >= 0) {
      this.usageAlerts[idx] = { ...alert };
    } else {
      this.usageAlerts.push({ ...alert });
    }
  }
}
