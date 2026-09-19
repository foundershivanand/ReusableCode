import {
  CustomDomain,
  TenantBranding,
} from "../schemas/domain-schemas.js";

export interface DomainsRepository {
  getDomainById(id: string): Promise<CustomDomain | null>;
  getDomainByName(domain: string): Promise<CustomDomain | null>;
  getDomainsByTenant(tenantId: string): Promise<CustomDomain[]>;
  saveDomain(domain: CustomDomain): Promise<void>;
  deleteDomain(id: string): Promise<void>;
  getBranding(tenantId: string): Promise<TenantBranding | null>;
  saveBranding(branding: TenantBranding): Promise<void>;
}

export class InMemoryDomainsRepository implements DomainsRepository {
  private domains = new Map<string, CustomDomain>();
  private brandings = new Map<string, TenantBranding>();

  async getDomainById(id: string): Promise<CustomDomain | null> {
    const d = this.domains.get(id);
    return d ? { ...d } : null;
  }

  async getDomainByName(domain: string): Promise<CustomDomain | null> {
    const target = domain.toLowerCase();
    for (const d of this.domains.values()) {
      if (d.domain.toLowerCase() === target) {
        return { ...d };
      }
    }
    return null;
  }

  async getDomainsByTenant(tenantId: string): Promise<CustomDomain[]> {
    return Array.from(this.domains.values())
      .filter((d) => d.tenantId === tenantId)
      .map((d) => ({ ...d }));
  }

  async saveDomain(domain: CustomDomain): Promise<void> {
    this.domains.set(domain.id, { ...domain });
  }

  async deleteDomain(id: string): Promise<void> {
    this.domains.delete(id);
  }

  async getBranding(tenantId: string): Promise<TenantBranding | null> {
    const b = this.brandings.get(tenantId);
    return b ? { ...b } : null;
  }

  async saveBranding(branding: TenantBranding): Promise<void> {
    this.brandings.set(branding.tenantId, { ...branding });
  }
}
