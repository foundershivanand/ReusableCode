import type {
  Organization,
  Workspace,
  Member,
  Invitation,
  TenantRole,
  CreateOrganizationInput,
  CreateWorkspaceInput,
  InviteMemberInput,
  TenantContext
} from "../schemas/index.js";

export interface TenancyClientOptions {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  getActiveTenantId?: () => string | null;
}

export class TenancyClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null> | string | null;
  private getActiveTenantId?: () => string | null;

  constructor(options: TenancyClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/tenancy";
    this.getAuthToken = options.getAuthToken;
    this.getActiveTenantId = options.getActiveTenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    if (this.getActiveTenantId) {
      const tenantId = this.getActiveTenantId();
      if (tenantId) headers.set("X-Tenant-Id", tenantId);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Tenancy API Error: ${res.status}`);
    }

    return res.json();
  }

  async getContext(): Promise<TenantContext> {
    return this.request<TenantContext>("/context");
  }

  async listOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>("/organizations");
  }

  async createOrganization(input: CreateOrganizationInput): Promise<{ org: Organization; member: Member }> {
    return this.request<{ org: Organization; member: Member }>("/organizations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>("/workspaces");
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    return this.request<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async listMembers(): Promise<Member[]> {
    return this.request<Member[]>("/members");
  }

  async inviteMember(input: InviteMemberInput): Promise<Invitation> {
    return this.request<Invitation>("/members/invite", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateMemberRole(memberId: string, role: TenantRole): Promise<Member> {
    return this.request<Member>(`/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
  }

  async removeMember(memberId: string): Promise<void> {
    await this.request(`/members/${memberId}`, { method: "DELETE" });
  }

  async transferOwnership(targetUserId: string, confirmationPhrase: string): Promise<void> {
    await this.request("/organization/transfer-ownership", {
      method: "POST",
      body: JSON.stringify({ targetUserId, confirmationPhrase })
    });
  }

  async deleteOrganization(confirmationSlug: string): Promise<void> {
    await this.request("/organization", {
      method: "DELETE",
      body: JSON.stringify({ confirmationSlug })
    });
  }
}
