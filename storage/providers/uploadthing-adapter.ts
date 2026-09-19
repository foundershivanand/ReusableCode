import type { StorageProvider, PresignedUploadParams, PresignedDownloadParams } from "./storage-provider.js";

export class UploadThingAdapter implements StorageProvider {
  public readonly name = "uploadthing";

  constructor(public readonly apiKey: string) {}

  async getPresignedUploadUrl(params: PresignedUploadParams): Promise<{ url: string; headers: Record<string, string> }> {
    const url = `https://upload.uploadthing.com/${params.storageKey}?token=${this.apiKey.substring(0, 8)}`;
    return {
      url,
      headers: {
        "Content-Type": params.mimeType
      }
    };
  }

  async getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string> {
    return `https://utfs.io/f/${params.storageKey}`;
  }

  async deleteObject(_storageKey: string): Promise<void> {}

  async objectExists(_storageKey: string): Promise<boolean> {
    return true;
  }
}
