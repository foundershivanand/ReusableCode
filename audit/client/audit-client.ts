import type {
  AuditLogEntry,
  AuditQueryFilter,
  CreateAuditLogInput
} from "../schemas/audit-schemas.js";

export interface AuditClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class AuditClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: AuditClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/audit";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async logActivity(input: CreateAuditLogInput): Promise<AuditLogEntry> {
    const res = await this.fetchFn(`${this.baseUrl}/log`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to log audit activity: ${res.statusText}`);
    return res.json();
  }

  async queryLogs(
    filter: AuditQueryFilter
  ): Promise<{ entries: AuditLogEntry[]; nextCursor?: string }> {
    const res = await this.fetchFn(`${this.baseUrl}/query`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(filter)
    });
    if (!res.ok) throw new Error(`Failed to query audit logs: ${res.statusText}`);
    return res.json();
  }

  async verifyIntegrity(tenantId: string): Promise<{ valid: boolean; compromisedIndex?: number }> {
    const res = await this.fetchFn(`${this.baseUrl}/verify?tenantId=${tenantId}`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to verify audit integrity: ${res.statusText}`);
    return res.json();
  }
}
