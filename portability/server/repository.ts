import type { ExportJob, ImportJob } from "../schemas/portability-schemas.js";

export interface IPortabilityRepository {
  saveExportJob(job: ExportJob): Promise<ExportJob>;
  getExportJob(id: string): Promise<ExportJob | null>;
  listExportJobs(tenantId: string): Promise<ExportJob[]>;
  saveImportJob(job: ImportJob): Promise<ImportJob>;
  getImportJob(id: string): Promise<ImportJob | null>;
  listImportJobs(tenantId: string): Promise<ImportJob[]>;
}

export class InMemoryPortabilityRepository implements IPortabilityRepository {
  private exportJobs: Map<string, ExportJob> = new Map();
  private importJobs: Map<string, ImportJob> = new Map();

  async saveExportJob(job: ExportJob): Promise<ExportJob> {
    this.exportJobs.set(job.id, JSON.parse(JSON.stringify(job)));
    return job;
  }

  async getExportJob(id: string): Promise<ExportJob | null> {
    const j = this.exportJobs.get(id);
    return j ? JSON.parse(JSON.stringify(j)) : null;
  }

  async listExportJobs(tenantId: string): Promise<ExportJob[]> {
    return Array.from(this.exportJobs.values())
      .filter((j) => j.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveImportJob(job: ImportJob): Promise<ImportJob> {
    this.importJobs.set(job.id, JSON.parse(JSON.stringify(job)));
    return job;
  }

  async getImportJob(id: string): Promise<ImportJob | null> {
    const j = this.importJobs.get(id);
    return j ? JSON.parse(JSON.stringify(j)) : null;
  }

  async listImportJobs(tenantId: string): Promise<ImportJob[]> {
    return Array.from(this.importJobs.values())
      .filter((j) => j.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
