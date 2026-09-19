import type {
  ConsentEvidence,
  DataSubjectRequest,
  RetentionPolicy,
  VendorProcessor
} from "../schemas/compliance-schemas.js";

export interface IComplianceRepository {
  saveConsent(consent: ConsentEvidence): Promise<ConsentEvidence>;
  getLatestConsent(userId: string, tenantId: string): Promise<ConsentEvidence | null>;
  saveDsr(dsr: DataSubjectRequest): Promise<DataSubjectRequest>;
  getDsr(id: string): Promise<DataSubjectRequest | null>;
  listDsrs(tenantId: string): Promise<DataSubjectRequest[]>;
  saveRetentionPolicy(policy: RetentionPolicy): Promise<RetentionPolicy>;
  listRetentionPolicies(): Promise<RetentionPolicy[]>;
  saveVendor(vendor: VendorProcessor): Promise<VendorProcessor>;
  listVendors(): Promise<VendorProcessor[]>;
  isUserUnderLegalHold(userId: string, tenantId: string): Promise<boolean>;
  setUserLegalHold(userId: string, tenantId: string, isHold: boolean): Promise<void>;
}

export class InMemoryComplianceRepository implements IComplianceRepository {
  private consents: Map<string, ConsentEvidence[]> = new Map();
  private dsrs: Map<string, DataSubjectRequest> = new Map();
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private vendors: Map<string, VendorProcessor> = new Map();
  private legalHolds: Set<string> = new Set();

  private getUserKey(userId: string, tenantId: string): string {
    return `${tenantId}:${userId}`;
  }

  async saveConsent(consent: ConsentEvidence): Promise<ConsentEvidence> {
    const key = this.getUserKey(consent.userId, consent.tenantId);
    const list = this.consents.get(key) || [];
    list.push(JSON.parse(JSON.stringify(consent)));
    this.consents.set(key, list);
    return consent;
  }

  async getLatestConsent(userId: string, tenantId: string): Promise<ConsentEvidence | null> {
    const key = this.getUserKey(userId, tenantId);
    const list = this.consents.get(key) || [];
    return list.length > 0 ? JSON.parse(JSON.stringify(list[list.length - 1])) : null;
  }

  async saveDsr(dsr: DataSubjectRequest): Promise<DataSubjectRequest> {
    this.dsrs.set(dsr.id, JSON.parse(JSON.stringify(dsr)));
    return dsr;
  }

  async getDsr(id: string): Promise<DataSubjectRequest | null> {
    const d = this.dsrs.get(id);
    return d ? JSON.parse(JSON.stringify(d)) : null;
  }

  async listDsrs(tenantId: string): Promise<DataSubjectRequest[]> {
    return Array.from(this.dsrs.values())
      .filter((d) => d.tenantId === tenantId)
      .map((d) => JSON.parse(JSON.stringify(d)));
  }

  async saveRetentionPolicy(policy: RetentionPolicy): Promise<RetentionPolicy> {
    this.retentionPolicies.set(policy.category, policy);
    return policy;
  }

  async listRetentionPolicies(): Promise<RetentionPolicy[]> {
    return Array.from(this.retentionPolicies.values());
  }

  async saveVendor(vendor: VendorProcessor): Promise<VendorProcessor> {
    this.vendors.set(vendor.name, vendor);
    return vendor;
  }

  async listVendors(): Promise<VendorProcessor[]> {
    return Array.from(this.vendors.values());
  }

  async isUserUnderLegalHold(userId: string, tenantId: string): Promise<boolean> {
    return this.legalHolds.has(this.getUserKey(userId, tenantId));
  }

  async setUserLegalHold(userId: string, tenantId: string, isHold: boolean): Promise<void> {
    const key = this.getUserKey(userId, tenantId);
    if (isHold) this.legalHolds.add(key);
    else this.legalHolds.delete(key);
  }
}
