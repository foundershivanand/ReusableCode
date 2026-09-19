export interface PresignedUploadParams {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  expiresInSeconds?: number;
}

export interface PresignedDownloadParams {
  storageKey: string;
  expiresInSeconds?: number;
  responseContentDisposition?: string;
}

export interface StorageProvider {
  readonly name: string;
  getPresignedUploadUrl(params: PresignedUploadParams): Promise<{ url: string; headers: Record<string, string> }>;
  getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
  objectExists(storageKey: string): Promise<boolean>;
}
