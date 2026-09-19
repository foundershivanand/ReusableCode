import {
  CustomDomain,
  TenantBranding,
  RequestDomainInput,
  UpdateBrandingInput,
} from "../schemas/domain-schemas.js";

export class DomainClient {
  constructor(
    private baseUrl: string = "/api/domains",
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
      throw new Error(errorData.message || `Domain API error: ${res.status}`);
    }

    return res.json();
  }

  async getDomains(tenantId: string): Promise<CustomDomain[]> {
    return this.request<CustomDomain[]>(`?tenantId=${encodeURIComponent(tenantId)}`);
  }

  async requestDomain(input: RequestDomainInput): Promise<CustomDomain> {
    return this.request<CustomDomain>("/request", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async verifyDomain(domainId: string, tenantId: string): Promise<CustomDomain> {
    return this.request<CustomDomain>(`/${encodeURIComponent(domainId)}/verify`, {
      method: "POST",
      body: JSON.stringify({ tenantId }),
    });
  }

  async deleteDomain(domainId: string, tenantId: string): Promise<void> {
    return this.request<void>(`/${encodeURIComponent(domainId)}?tenantId=${encodeURIComponent(tenantId)}`, {
      method: "DELETE",
    });
  }

  async getBranding(tenantId: string): Promise<TenantBranding> {
    return this.request<TenantBranding>(`/branding?tenantId=${encodeURIComponent(tenantId)}`);
  }

  async updateBranding(input: UpdateBrandingInput): Promise<TenantBranding> {
    return this.request<TenantBranding>("/branding", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }
}
