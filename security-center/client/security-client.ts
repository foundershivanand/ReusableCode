import {
  SecurityFinding,
  SecurityEvent,
  SecurityPostureScore,
  SuppressionInput,
  FindingLifecycleState,
} from "../schemas/security-schemas.js";

export class SecurityClient {
  constructor(
    private baseUrl: string = "/api/security-center",
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
      throw new Error(errorData.message || `Security Center API error: ${res.status}`);
    }

    return res.json();
  }

  async getFindings(options?: { state?: string; severity?: string; includeSuppressed?: boolean }): Promise<SecurityFinding[]> {
    const params = new URLSearchParams();
    if (options?.state) params.set("state", options.state);
    if (options?.severity) params.set("severity", options.severity);
    if (options?.includeSuppressed) params.set("includeSuppressed", "true");
    const q = params.toString() ? `?${params.toString()}` : "";
    return this.request<SecurityFinding[]>(`/findings${q}`);
  }

  async updateFindingState(findingId: string, state: FindingLifecycleState): Promise<SecurityFinding> {
    return this.request<SecurityFinding>(`/findings/${encodeURIComponent(findingId)}/state`, {
      method: "PUT",
      body: JSON.stringify({ state }),
    });
  }

  async suppressFinding(input: SuppressionInput): Promise<SecurityFinding> {
    return this.request<SecurityFinding>(`/findings/${encodeURIComponent(input.findingId)}/suppress`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getPostureScore(): Promise<SecurityPostureScore> {
    return this.request<SecurityPostureScore>("/posture");
  }

  async getPostureHistory(): Promise<SecurityPostureScore[]> {
    return this.request<SecurityPostureScore[]>("/posture/history");
  }

  async getEvents(limit?: number): Promise<SecurityEvent[]> {
    const q = limit ? `?limit=${limit}` : "";
    return this.request<SecurityEvent[]>(`/events${q}`);
  }
}
