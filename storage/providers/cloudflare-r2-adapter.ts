import type { StorageProvider, PresignedUploadParams, PresignedDownloadParams } from "./storage-provider.js";

export class CloudflareR2Adapter implements StorageProvider {
  public readonly name = "cloudflare-r2";

  constructor(
    public readonly accountId: string,
    public readonly bucket: string
  ) {}

  async getPresignedUploadUrl(params: PresignedUploadParams): Promise<{ url: string; headers: Record<string, string> }> {
    const url = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${params.storageKey}?expires=${params.expiresInSeconds || 900}&signed=true`;
    return {
      url,
      headers: {
        "Content-Type": params.mimeType,
        "Content-Length": String(params.sizeBytes)
      }
    };
  }

  async getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string> {
    return `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${params.storageKey}?expires=${params.expiresInSeconds || 3600}&signed=true`;
  }

  async deleteObject(_storageKey: string): Promise<void> {
    // R2 DeleteObject
  }

  async objectExists(_storageKey: string): Promise<boolean> {
    return true;
  }
}
