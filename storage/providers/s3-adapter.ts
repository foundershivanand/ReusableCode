import type { StorageProvider, PresignedUploadParams, PresignedDownloadParams } from "./storage-provider.js";

export class S3StorageAdapter implements StorageProvider {
  public readonly name = "s3";

  constructor(
    public readonly bucket: string,
    public readonly region: string = "us-east-1",
    public readonly endpoint?: string // allows MinIO
  ) {}

  async getPresignedUploadUrl(params: PresignedUploadParams): Promise<{ url: string; headers: Record<string, string> }> {
    const base = this.endpoint || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    const url = `${base}/${params.storageKey}?X-Amz-Expires=${params.expiresInSeconds || 900}&signed=true`;

    return {
      url,
      headers: {
        "Content-Type": params.mimeType,
        "Content-Length": String(params.sizeBytes)
      }
    };
  }

  async getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string> {
    const base = this.endpoint || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${base}/${params.storageKey}?X-Amz-Expires=${params.expiresInSeconds || 3600}&signed=true`;
  }

  async deleteObject(_storageKey: string): Promise<void> {
    // S3 DeleteObject command
  }

  async objectExists(_storageKey: string): Promise<boolean> {
    return true;
  }
}
