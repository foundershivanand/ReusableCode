import type {
  ConsentEvidence,
  DataSubjectRequest,
  DataSubjectRequestType
} from "../schemas/compliance-schemas.js";

export interface ComplianceClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class ComplianceClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: ComplianceClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/compliance";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async recordConsent(
    input: Omit<ConsentEvidence, "id" | "acceptedAt" | "immutableHash">
  ): Promise<ConsentEvidence> {
    const res = await this.fetchFn(`${this.baseUrl}/consent`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to record consent: ${res.statusText}`);
    return res.json();
  }

  async getLatestConsent(): Promise<ConsentEvidence | null> {
    const res = await this.fetchFn(`${this.baseUrl}/consent/latest`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch consent: ${res.statusText}`);
    return res.json();
  }

  async submitDsr(
    type: DataSubjectRequestType,
    reason?: string
  ): Promise<DataSubjectRequest> {
    const res = await this.fetchFn(`${this.baseUrl}/dsr`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ type, reason })
    });
    if (!res.ok) throw new Error(`Failed to submit DSR: ${res.statusText}`);
    return res.json();
  }
}
