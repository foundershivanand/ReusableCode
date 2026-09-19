import type { FileRecord, StorageQuota, FileScanStatus } from "../schemas/index.js";

export interface StorageRepository {
  createFileRecord(file: FileRecord): Promise<FileRecord>;
  getFileById(id: string): Promise<FileRecord | null>;
  getFileByStorageKey(storageKey: string): Promise<FileRecord | null>;
  updateFileScanStatus(id: string, status: FileScanStatus): Promise<void>;
  deleteFile(id: string, soft?: boolean): Promise<void>;
  listFiles(tenantId: string, limit?: number, offset?: number): Promise<FileRecord[]>;

  getStorageQuota(tenantId: string): Promise<StorageQuota>;
  incrementStorageUsage(tenantId: string, bytes: number): Promise<StorageQuota>;
  decrementStorageUsage(tenantId: string, bytes: number): Promise<StorageQuota>;
}

export class InMemoryStorageRepository implements StorageRepository {
  private files: Map<string, FileRecord> = new Map();
  private quotas: Map<string, StorageQuota> = new Map();

  async createFileRecord(file: FileRecord): Promise<FileRecord> {
    this.files.set(file.id, { ...file });
    return { ...file };
  }

  async getFileById(id: string): Promise<FileRecord | null> {
    const f = this.files.get(id);
    if (!f || f.deletedAt) return null;
    return { ...f };
  }

  async getFileByStorageKey(storageKey: string): Promise<FileRecord | null> {
    for (const f of this.files.values()) {
      if (f.storageKey === storageKey && !f.deletedAt) {
        return { ...f };
      }
    }
    return null;
  }

  async updateFileScanStatus(id: string, status: FileScanStatus): Promise<void> {
    const f = this.files.get(id);
    if (f) {
      f.scanStatus = status;
      f.updatedAt = new Date();
      this.files.set(id, f);
    }
  }

  async deleteFile(id: string, soft = true): Promise<void> {
    const f = this.files.get(id);
    if (!f) return;
    if (soft) {
      f.deletedAt = new Date();
      f.updatedAt = new Date();
      this.files.set(id, f);
    } else {
      this.files.delete(id);
    }
  }

  async listFiles(tenantId: string, limit = 50, offset = 0): Promise<FileRecord[]> {
    return Array.from(this.files.values())
      .filter((f) => f.tenantId === tenantId && !f.deletedAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit)
      .map((f) => ({ ...f }));
  }

  async getStorageQuota(tenantId: string): Promise<StorageQuota> {
    const q = this.quotas.get(tenantId);
    if (q) return { ...q };

    const defaultQuota: StorageQuota = {
      tenantId,
      usedBytes: 0,
      maxBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      maxFileSizeBytes: 50 * 1024 * 1024 // 50 MB
    };
    this.quotas.set(tenantId, defaultQuota);
    return defaultQuota;
  }

  async incrementStorageUsage(tenantId: string, bytes: number): Promise<StorageQuota> {
    const q = await this.getStorageQuota(tenantId);
    q.usedBytes += bytes;
    this.quotas.set(tenantId, q);
    return { ...q };
  }

  async decrementStorageUsage(tenantId: string, bytes: number): Promise<StorageQuota> {
    const q = await this.getStorageQuota(tenantId);
    q.usedBytes = Math.max(0, q.usedBytes - bytes);
    this.quotas.set(tenantId, q);
    return { ...q };
  }
}
