import type {
  FileRecord,
  PresignedUploadRequest,
  PresignedUploadResult,
  StorageQuota
} from "../schemas/index.js";

export interface StorageClientOptions {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  getTenantId?: () => string | null;
}

export class StorageClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null> | string | null;
  private getTenantId?: () => string | null;

  constructor(options: StorageClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/storage";
    this.getAuthToken = options.getAuthToken;
    this.getTenantId = options.getTenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    if (this.getTenantId) {
      const tenantId = this.getTenantId();
      if (tenantId) headers.set("X-Tenant-Id", tenantId);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Storage API Error: ${res.status}`);
    }

    return res.json();
  }

  async requestUpload(request: PresignedUploadRequest): Promise<PresignedUploadResult> {
    return this.request<PresignedUploadResult>("/upload/presign", {
      method: "POST",
      body: JSON.stringify(request)
    });
  }

  async uploadFileDirect(
    file: File,
    presigned: PresignedUploadResult,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presigned.uploadUrl);

      Object.entries(presigned.headers).forEach(([k, v]) => {
        xhr.setRequestHeader(k, v);
      });

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during file upload"));
      xhr.send(file);
    });
  }

  async completeUpload(fileId: string): Promise<FileRecord> {
    return this.request<FileRecord>(`/upload/${fileId}/complete`, { method: "POST" });
  }

  async getDownloadUrl(fileId: string): Promise<{ downloadUrl: string }> {
    return this.request<{ downloadUrl: string }>(`/files/${fileId}/download`);
  }

  async listFiles(): Promise<FileRecord[]> {
    return this.request<FileRecord[]>("/files");
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/files/${fileId}`, { method: "DELETE" });
  }

  async getQuota(): Promise<StorageQuota> {
    return this.request<StorageQuota>("/quota");
  }
}
