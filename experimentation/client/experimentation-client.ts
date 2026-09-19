import {
  Experiment,
  VariantDefinition,
  RawMetricsReport,
} from "../schemas/experiment-schemas.js";

export class ExperimentationClient {
  constructor(
    private baseUrl: string = "/api/experiments",
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
      throw new Error(errorData.message || `Experimentation API error: ${res.status}`);
    }

    return res.json();
  }

  async getVariant(experimentKey: string, userId: string, context?: Record<string, unknown>): Promise<{ variant: VariantDefinition | null; isEligible: boolean }> {
    return this.request("/variant", {
      method: "POST",
      body: JSON.stringify({ experimentKey, userId, ...context }),
    });
  }

  async trackExposure(experimentKey: string, userId: string): Promise<void> {
    return this.request("/exposure", {
      method: "POST",
      body: JSON.stringify({ experimentKey, userId }),
    });
  }

  async trackConversion(experimentKey: string, userId: string, metricName: string, value?: number): Promise<void> {
    return this.request("/conversion", {
      method: "POST",
      body: JSON.stringify({ experimentKey, userId, metricName, value }),
    });
  }

  async listExperiments(): Promise<Experiment[]> {
    return this.request<Experiment[]>("");
  }

  async getResults(experimentKey: string): Promise<RawMetricsReport> {
    return this.request<RawMetricsReport>(`/${encodeURIComponent(experimentKey)}/results`);
  }
}
