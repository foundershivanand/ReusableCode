import type {
  GenerateTextInput,
  GenerateTextResult,
  StreamChunk,
  AIBudget,
  BackgroundJob,
  JobStatus
} from "../schemas/index.js";

export interface AIClientOptions {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  getTenantId?: () => string | null;
}

export class AIClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null> | string | null;
  private getTenantId?: () => string | null;

  constructor(options: AIClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/ai";
    this.getAuthToken = options.getAuthToken;
    this.getTenantId = options.getTenantId;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    if (this.getTenantId) {
      const tenantId = this.getTenantId();
      if (tenantId) headers["X-Tenant-ID"] = tenantId;
    }

    return headers;
  }

  public async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI generation error: ${err}`);
    }

    return (await res.json()) as GenerateTextResult;
  }

  public async generateStream(
    input: GenerateTextInput,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify(input)
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(`AI stream error: ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "").trim();
          if (jsonStr === "[DONE]") return;
          try {
            const chunk = JSON.parse(jsonStr) as StreamChunk;
            onChunk(chunk);
          } catch {
            // Ignore malformed chunks in stream
          }
        }
      }
    }
  }

  public async getBudget(): Promise<AIBudget> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/budget`, { headers });
    if (!res.ok) throw new Error("Failed to fetch AI budget");
    return (await res.json()) as AIBudget;
  }

  public async listJobs(status?: JobStatus): Promise<BackgroundJob[]> {
    const headers = await this.getHeaders();
    const url = new URL(`${this.baseUrl}/jobs`, window?.location?.origin || "http://localhost");
    if (status) url.searchParams.set("status", status);

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error("Failed to list background jobs");
    return (await res.json()) as BackgroundJob[];
  }

  public async enqueueJob(name: string, payload: any): Promise<BackgroundJob> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, payload })
    });
    if (!res.ok) throw new Error("Failed to enqueue background job");
    return (await res.json()) as BackgroundJob;
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const headers = await this.getHeaders();
    const res = await fetch(`${this.baseUrl}/jobs/${jobId}/cancel`, {
      method: "POST",
      headers
    });
    return res.ok;
  }
}
