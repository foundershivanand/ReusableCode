import type { FeatureFlag, FlagAuditEntry } from "../schemas/flag-schemas.js";

export interface IFeatureFlagRepository {
  getFlag(key: string): Promise<FeatureFlag | null>;
  saveFlag(flag: FeatureFlag): Promise<FeatureFlag>;
  listFlags(): Promise<FeatureFlag[]>;
  deleteFlag(key: string): Promise<void>;
  saveAuditEntry(entry: FlagAuditEntry): Promise<void>;
  listAuditEntries(flagKey?: string): Promise<FlagAuditEntry[]>;
}

export class InMemoryFeatureFlagRepository implements IFeatureFlagRepository {
  private flags: Map<string, FeatureFlag> = new Map();
  private auditLog: FlagAuditEntry[] = [];

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const f = this.flags.get(key);
    return f ? JSON.parse(JSON.stringify(f)) : null;
  }

  async saveFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    const updated = { ...flag, updatedAt: new Date() };
    this.flags.set(flag.key, JSON.parse(JSON.stringify(updated)));
    return updated;
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values()).map((f) => JSON.parse(JSON.stringify(f)));
  }

  async deleteFlag(key: string): Promise<void> {
    this.flags.delete(key);
  }

  async saveAuditEntry(entry: FlagAuditEntry): Promise<void> {
    this.auditLog.push(JSON.parse(JSON.stringify(entry)));
  }

  async listAuditEntries(flagKey?: string): Promise<FlagAuditEntry[]> {
    if (!flagKey) return [...this.auditLog];
    return this.auditLog.filter((e) => e.flagKey === flagKey);
  }
}
