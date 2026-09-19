import type { PageMetadataInput, SitemapUrlEntry } from "../schemas/seo-schemas.js";

export interface ISeoRepository {
  getRouteMetadata(path: string, tenantId?: string): Promise<PageMetadataInput | null>;
  saveRouteMetadata(metadata: PageMetadataInput): Promise<PageMetadataInput>;
  listPublicRoutes(tenantId?: string): Promise<SitemapUrlEntry[]>;
}

export class InMemorySeoRepository implements ISeoRepository {
  private routeMetadata: Map<string, PageMetadataInput> = new Map();
  private publicRoutes: SitemapUrlEntry[] = [];

  private getKey(path: string, tenantId?: string): string {
    return `${tenantId || "default"}:${path}`;
  }

  async getRouteMetadata(path: string, tenantId?: string): Promise<PageMetadataInput | null> {
    const key = this.getKey(path, tenantId);
    return this.routeMetadata.get(key) || null;
  }

  async saveRouteMetadata(metadata: PageMetadataInput): Promise<PageMetadataInput> {
    const key = this.getKey(metadata.canonicalPath, metadata.tenantId);
    this.routeMetadata.set(key, JSON.parse(JSON.stringify(metadata)));
    return metadata;
  }

  async listPublicRoutes(tenantId?: string): Promise<SitemapUrlEntry[]> {
    return [...this.publicRoutes];
  }

  addPublicRoute(entry: SitemapUrlEntry): void {
    this.publicRoutes.push(entry);
  }
}
