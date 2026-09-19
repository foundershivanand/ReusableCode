import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult,
  FlagAuditEntry
} from "../schemas/flag-schemas.js";

export interface FeatureFlagsClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class FeatureFlagsClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: FeatureFlagsClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/flags";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async hasFeature(key: string, context?: EvaluationContext): Promise<boolean> {
    const res = await this.evaluate(key, context);
    return res.enabled;
  }

  async evaluate(key: string, context?: EvaluationContext): Promise<EvaluationResult> {
    const res = await this.fetchFn(`${this.baseUrl}/evaluate`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ key, context })
    });
    if (!res.ok) throw new Error(`Failed to evaluate flag: ${res.statusText}`);
    return res.json();
  }

  async listFlags(): Promise<FeatureFlag[]> {
    const res = await this.fetchFn(`${this.baseUrl}`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to list flags: ${res.statusText}`);
    return res.json();
  }

  async toggleFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
    const res = await this.fetchFn(`${this.baseUrl}/${key}/toggle`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(`Failed to toggle flag: ${res.statusText}`);
    return res.json();
  }

  async setRollout(key: string, percentage: number): Promise<FeatureFlag> {
    const res = await this.fetchFn(`${this.baseUrl}/${key}/rollout`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ percentage })
    });
    if (!res.ok) throw new Error(`Failed to update rollout: ${res.statusText}`);
    return res.json();
  }

  async getAuditLog(key?: string): Promise<FlagAuditEntry[]> {
    const url = key ? `${this.baseUrl}/${key}/audits` : `${this.baseUrl}/audits`;
    const res = await this.fetchFn(url, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch flag audits: ${res.statusText}`);
    return res.json();
  }
}
