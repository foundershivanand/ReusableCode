import type {
  SearchQueryInput,
  SearchResultItem,
  CommandItem
} from "../schemas/search-schemas.js";

export interface SearchClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class SearchClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: SearchClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/search";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  async search(input: SearchQueryInput): Promise<SearchResultItem[]> {
    const res = await this.fetchFn(`${this.baseUrl}/query`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    return res.json();
  }

  async getCommands(): Promise<CommandItem[]> {
    const res = await this.fetchFn(`${this.baseUrl}/commands`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to load commands: ${res.statusText}`);
    return res.json();
  }
}
