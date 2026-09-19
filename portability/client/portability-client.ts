import type {
  ExportJob,
  ImportJob,
  CreateExportInput,
  CreateImportInput
} from "../schemas/portability-schemas.js";

export interface PortabilityClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class PortabilityClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: PortabilityClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/portability";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async requestExport(input: CreateExportInput): Promise<ExportJob> {
    const res = await this.fetchFn(`${this.baseUrl}/export`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Export request failed: ${res.statusText}`);
    return res.json();
  }

  async getExportStatus(jobId: string): Promise<ExportJob> {
    const res = await this.fetchFn(`${this.baseUrl}/export/${jobId}`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch export status: ${res.statusText}`);
    return res.json();
  }

  async startImport(input: CreateImportInput): Promise<ImportJob> {
    const res = await this.fetchFn(`${this.baseUrl}/import`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Import failed: ${res.statusText}`);
    return res.json();
  }

  async getImportStatus(jobId: string): Promise<ImportJob> {
    const res = await this.fetchFn(`${this.baseUrl}/import/${jobId}`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to fetch import status: ${res.statusText}`);
    return res.json();
  }
}
