import type {
  PageMetadataInput,
  ResolvedMetadata
} from "../schemas/seo-schemas.js";

export interface SeoClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class SeoClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: SeoClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/seo";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async resolveMetadata(input: PageMetadataInput): Promise<ResolvedMetadata> {
    const res = await this.fetchFn(`${this.baseUrl}/metadata`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to resolve SEO metadata: ${res.statusText}`);
    return res.json();
  }
}
