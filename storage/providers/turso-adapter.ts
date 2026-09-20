import type {
  StorageProvider,
  PresignedUploadParams,
  PresignedDownloadParams,
} from "./storage-provider.js";
import { TursoStorageService } from "../../turso-storage/service.ts";
import { getConfig } from "../../turso-storage/config.ts";
import { generateToken } from "../../turso-storage/auth.ts";

export interface TursoStorageAdapterOptions {
  service?: TursoStorageService;
  baseUrl?: string;
}

export class TursoStorageAdapter implements StorageProvider {
  readonly name = "turso";
  private service: TursoStorageService;
  private baseUrl: string;

  constructor(options: TursoStorageAdapterOptions = {}) {
    this.service = options.service || new TursoStorageService();
    const config = getConfig();
    this.baseUrl = options.baseUrl || `http://localhost:${config.port}`;
  }

  async initialize(): Promise<void> {
    await this.service.initialize();
  }

  async getPresignedUploadUrl(
    params: PresignedUploadParams
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const config = getConfig();
    const token = generateToken(config.adminUsername);

    return {
      url: `${this.baseUrl}/api/upload`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": params.mimeType,
        "X-Storage-Path": params.storageKey,
      },
    };
  }

  async getPresignedDownloadUrl(
    params: PresignedDownloadParams
  ): Promise<string> {
    const file = await this.service.getFileByPath(params.storageKey);
    if (!file) {
      throw new Error(`File not found in Turso storage: ${params.storageKey}`);
    }

    const config = getConfig();
    const token = generateToken(config.adminUsername);
    return `${this.baseUrl}/api/files/${file.id}/download?token=${token}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.service.deleteFile({ path: storageKey });
  }

  async objectExists(storageKey: string): Promise<boolean> {
    const file = await this.service.getFileByPath(storageKey);
    return file !== null;
  }

  // Direct programmatic methods
  async storeFile(path: string, buffer: Buffer, customMimeType?: string) {
    return this.service.upsertFile({ path, buffer, customMimeType });
  }

  async retrieveFile(path: string) {
    return this.service.getFileByPath(path);
  }

  getService(): TursoStorageService {
    return this.service;
  }
}
