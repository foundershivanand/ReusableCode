import { randomUUID } from "node:crypto";
import type { ISearchRepository } from "./repository.js";
import { CommandRegistry } from "./command-registry.js";
import {
  type SearchQueryInput,
  type SearchResultItem,
  type SearchDocument,
  type ReindexProgress,
  type CommandItem,
  SearchQueryInputSchema,
  SearchDocumentSchema
} from "../schemas/search-schemas.js";

export class GlobalSearchService {
  public readonly commandRegistry: CommandRegistry;

  constructor(
    private readonly repository: ISearchRepository,
    commandRegistry?: CommandRegistry
  ) {
    this.commandRegistry = commandRegistry || new CommandRegistry();
  }

  async search(input: SearchQueryInput): Promise<SearchResultItem[]> {
    const validated = SearchQueryInputSchema.parse(input);

    // Query abuse protection: strip dangerous regex and wildcard characters
    const sanitizedQuery = validated.query.replace(/[^a-zA-Z0-9\s_-]/g, " ").trim();
    if (!sanitizedQuery) return [];

    return this.repository.search({
      ...validated,
      query: sanitizedQuery
    });
  }

  async indexDocument(doc: SearchDocument): Promise<void> {
    const validated = SearchDocumentSchema.parse(doc);
    await this.repository.index(validated);
  }

  async removeDocument(id: string, tenantId: string): Promise<void> {
    await this.repository.remove(id, tenantId);
  }

  getAvailableCommands(userRoles: string[] = [], userPermissions: string[] = []): CommandItem[] {
    return this.commandRegistry.getAuthorizedCommands(userRoles, userPermissions);
  }

  async triggerReindex(tenantId: string, documents: SearchDocument[]): Promise<ReindexProgress> {
    const jobId = `reindex_${Date.now()}_${randomUUID().substring(0, 6)}`;
    const progress: ReindexProgress = {
      jobId,
      tenantId,
      totalDocuments: documents.length,
      processedDocuments: 0,
      failedDocuments: 0,
      status: "RUNNING",
      startedAt: new Date()
    };

    await this.repository.saveReindexJob(progress);

    // Process documents
    for (const doc of documents) {
      try {
        await this.indexDocument({ ...doc, tenantId });
        progress.processedDocuments++;
      } catch {
        progress.failedDocuments++;
      }
    }

    progress.status = progress.failedDocuments === 0 ? "COMPLETED" : "FAILED";
    progress.completedAt = new Date();
    await this.repository.saveReindexJob(progress);

    return progress;
  }

  async getReindexStatus(jobId: string): Promise<ReindexProgress | null> {
    return this.repository.getReindexJob(jobId);
  }
}
