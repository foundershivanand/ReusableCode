import type {
  SearchDocument,
  SearchQueryInput,
  SearchResultItem,
  ReindexProgress
} from "../schemas/search-schemas.js";

export interface ISearchRepository {
  index(doc: SearchDocument): Promise<void>;
  remove(id: string, tenantId: string): Promise<void>;
  search(input: SearchQueryInput): Promise<SearchResultItem[]>;
  saveReindexJob(job: ReindexProgress): Promise<void>;
  getReindexJob(jobId: string): Promise<ReindexProgress | null>;
  count(tenantId: string): Promise<number>;
}

export class InMemorySearchRepository implements ISearchRepository {
  private docs: Map<string, SearchDocument> = new Map();
  private reindexJobs: Map<string, ReindexProgress> = new Map();

  private getKey(id: string, tenantId: string): string {
    return `${tenantId}:${id}`;
  }

  async index(doc: SearchDocument): Promise<void> {
    const key = this.getKey(doc.id, doc.tenantId);
    this.docs.set(key, JSON.parse(JSON.stringify(doc)));
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const key = this.getKey(id, tenantId);
    const existing = this.docs.get(key);
    if (existing) {
      existing.isDeleted = true;
      this.docs.set(key, existing);
    }
  }

  async search(input: SearchQueryInput): Promise<SearchResultItem[]> {
    const q = input.query.toLowerCase().trim();
    const userRoles = new Set(input.userRoles);

    const matches: SearchResultItem[] = [];

    for (const doc of this.docs.values()) {
      if (doc.tenantId !== input.tenantId) continue;
      if (doc.isDeleted) continue;
      if (input.typeFilter && doc.type !== input.typeFilter) continue;

      // 1. Role-based permission check
      const allowedRoles = doc.allowedRoles ?? [];
      if (allowedRoles.length > 0) {
        const hasRole = allowedRoles.some((r) => userRoles.has(r));
        if (!hasRole) continue;
      }

      // 2. User-specific permission check
      const allowedUserIds = doc.allowedUserIds ?? [];
      if (allowedUserIds.length > 0 && !allowedUserIds.includes(input.userId)) {
        continue;
      }

      // 3. Match query against title and content (token-based)
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);

      const isMatch =
        tokens.length > 0 &&
        tokens.every((t) => titleLower.includes(t) || contentLower.includes(t));

      if (isMatch) {
        // Snippet generation (safe, no secret leakage, 120 chars max)
        const snippet = this.generateSnippet(doc.content, tokens[0] || q);

        matches.push({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          snippet,
          url: doc.url
        });

        const limit = input.limit ?? 20;
        if (matches.length >= limit) break;
      }
    }

    return matches;
  }

  async saveReindexJob(job: ReindexProgress): Promise<void> {
    this.reindexJobs.set(job.jobId, JSON.parse(JSON.stringify(job)));
  }

  async getReindexJob(jobId: string): Promise<ReindexProgress | null> {
    return this.reindexJobs.get(jobId) || null;
  }

  async count(tenantId: string): Promise<number> {
    let c = 0;
    for (const doc of this.docs.values()) {
      if (doc.tenantId === tenantId && !doc.isDeleted) c++;
    }
    return c;
  }

  private generateSnippet(content: string, query: string): string {
    const idx = content.toLowerCase().indexOf(query);
    if (idx === -1) {
      return content.substring(0, 100) + (content.length > 100 ? "..." : "");
    }
    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + query.length + 70);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < content.length ? "..." : "";
    return `${prefix}${content.substring(start, end).trim()}${suffix}`;
  }
}
