import type {
  AdminUser,
  DashboardStats,
  AdminAuditLog,
  BulkActionInput,
  BreakGlassEvent
} from "../schemas/index.js";

export interface AdminClientOptions {
  baseUrl?: string;
  getAdminToken?: () => Promise<string | null> | string | null;
}

export class AdminClient {
  private baseUrl: string;
  private getAdminToken?: () => Promise<string | null> | string | null;

  constructor(options: AdminClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/admin";
    this.getAdminToken = options.getAdminToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (this.getAdminToken) {
      const token = await this.getAdminToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Admin API Error: ${res.status}`);
    }

    return res.json();
  }

  async getMe(): Promise<AdminUser> {
    return this.request<AdminUser>("/me");
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/stats");
  }

  async listAuditLogs(filter?: { targetId?: string; limit?: number; offset?: number }): Promise<AdminAuditLog[]> {
    const params = new URLSearchParams();
    if (filter?.targetId) params.set("targetId", filter.targetId);
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.offset) params.set("offset", String(filter.offset));
    return this.request<AdminAuditLog[]>(`/audit-logs?${params.toString()}`);
  }

  async startImpersonation(targetUserId: string, reason: string): Promise<{ impersonationToken: string; expiresAt: string }> {
    return this.request<{ impersonationToken: string; expiresAt: string }>("/impersonate", {
      method: "POST",
      body: JSON.stringify({ targetUserId, reason })
    });
  }

  async activateBreakGlass(reason: string, durationMinutes: number): Promise<BreakGlassEvent> {
    return this.request<BreakGlassEvent>("/break-glass", {
      method: "POST",
      body: JSON.stringify({ reason, durationMinutes })
    });
  }

  async executeBulkAction(input: BulkActionInput): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
    return this.request<{ successful: string[]; failed: { id: string; error: string }[] }>("/bulk-action", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }
}
