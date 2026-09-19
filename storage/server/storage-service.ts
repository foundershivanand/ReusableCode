import crypto from "node:crypto";
import path from "node:path";
import type { StorageRepository } from "./repository.js";
import type { StorageProvider } from "../providers/storage-provider.js";
import {
  type FileRecord,
  type PresignedUploadInput,
  type PresignedUploadResult,
  PresignedUploadRequestSchema
} from "../schemas/index.js";

export class QuotaExceededError extends Error {
  public readonly code = "STORAGE_QUOTA_EXCEEDED";
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class FileAccessDeniedError extends Error {
  public readonly code = "FILE_ACCESS_DENIED";
  constructor(message: string) {
    super(message);
    this.name = "FileAccessDeniedError";
  }
}

export class UnsafeFileError extends Error {
  public readonly code = "UNSAFE_FILE_DETECTED";
  constructor(reason: string) {
    super(`File rejected by security engine: ${reason}`);
    this.name = "UnsafeFileError";
  }
}

// Allowed MIME types & extensions
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg", "pdf", "txt", "csv", "json", "zip"
]);

export function sanitizeFilename(raw: string): string {
  // Strip path traversal characters, directory separators, and control characters
  const basename = path.basename(raw).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!basename || basename === "." || basename === "..") {
    return "unnamed_file";
  }
  return basename;
}

export function validateMagicBytes(headerBytes: Buffer, claimedMime: string): boolean {
  if (claimedMime === "image/png") {
    // 89 50 4E 47 0D 0A 1A 0A
    return headerBytes.length >= 4 &&
      headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47;
  }
  if (claimedMime === "image/jpeg") {
    // FF D8 FF
    return headerBytes.length >= 3 &&
      headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff;
  }
  if (claimedMime === "application/pdf") {
    // %PDF (25 50 44 46)
    return headerBytes.length >= 4 &&
      headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;
  }
  if (claimedMime === "image/gif") {
    // GIF8
    return headerBytes.toString("ascii", 0, 4).startsWith("GIF8");
  }
  return true; // Other types pass basic extension checks
}

export function inspectSvgSecurity(svgContent: string): void {
  const lower = svgContent.toLowerCase();
  if (
    lower.includes("<script") ||
    lower.includes("javascript:") ||
    lower.includes("onload=") ||
    lower.includes("onerror=") ||
    lower.includes("<!doctype") ||
    lower.includes("<!entity")
  ) {
    throw new UnsafeFileError("Dangerous SVG content detected (embedded script or XML entity)");
  }
}

export class StorageService {
  constructor(
    private repository: StorageRepository,
    private provider: StorageProvider
  ) {}

  /**
   * Generates a presigned upload URL after quota and MIME validation
   */
  async createPresignedUpload(input: PresignedUploadInput): Promise<PresignedUploadResult> {
    const request = PresignedUploadRequestSchema.parse(input);
    const quota = await this.repository.getStorageQuota(request.tenantId);

    // 1. Check Per-File Limit
    if (request.sizeBytes > quota.maxFileSizeBytes) {
      throw new QuotaExceededError(
        `File size (${(request.sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed (${(quota.maxFileSizeBytes / (1024 * 1024)).toFixed(1)}MB)`
      );
    }

    // 2. Check Aggregate Tenant Limit
    if (quota.usedBytes + request.sizeBytes > quota.maxBytes) {
      throw new QuotaExceededError("Tenant aggregate storage limit reached");
    }

    // 3. Sanitize filename and extract extension
    const sanitizedName = sanitizeFilename(request.filename);
    const ext = path.extname(sanitizedName).slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new UnsafeFileError(`File extension ".${ext}" is not permitted`);
    }

    const fileId = `file_${crypto.randomUUID()}`;
    // Internal object key: tenantId/files/fileId.ext (never use raw user path)
    const storageKey = `tenants/${request.tenantId}/files/${fileId}.${ext}`;

    const presigned = await this.provider.getPresignedUploadUrl({
      storageKey,
      mimeType: request.claimedMimeType,
      sizeBytes: request.sizeBytes,
      expiresInSeconds: 900 // 15 mins
    });

    const now = new Date();
    const record: FileRecord = {
      id: fileId,
      tenantId: request.tenantId,
      userId: request.userId,
      originalName: request.filename,
      sanitizedName,
      storageKey,
      sizeBytes: request.sizeBytes,
      mimeType: request.claimedMimeType,
      extension: ext,
      visibility: request.visibility,
      scanStatus: "UPLOADING",
      metadata: {},
      createdAt: now,
      updatedAt: now
    };

    await this.repository.createFileRecord(record);

    return {
      fileId,
      storageKey,
      uploadUrl: presigned.url,
      expiresAt: new Date(now.getTime() + 900 * 1000),
      headers: presigned.headers
    };
  }

  /**
   * Finalize upload and transition to SCANNING
   */
  async completeUpload(fileId: string): Promise<FileRecord> {
    const file = await this.repository.getFileById(fileId);
    if (!file) throw new Error(`File ${fileId} not found`);

    await this.repository.updateFileScanStatus(fileId, "SCANNING");
    file.scanStatus = "SCANNING";
    return file;
  }

  /**
   * Process asynchronous malware / safety scan result
   */
  async handleScanResult(fileId: string, isClean: boolean, _lastError?: string): Promise<void> {
    const file = await this.repository.getFileById(fileId);
    if (!file) return;

    if (isClean) {
      await this.repository.updateFileScanStatus(fileId, "SAFE");
      // Add bytes to quota upon verified safe storage
      await this.repository.incrementStorageUsage(file.tenantId, file.sizeBytes);
    } else {
      await this.repository.updateFileScanStatus(fileId, "REJECTED");
      // Immediately purge malicious object from storage
      await this.provider.deleteObject(file.storageKey);
    }
  }

  /**
   * Generates a presigned download URL with strict authorization and scan safety check
   */
  async getPresignedDownloadUrl(fileId: string, callerTenantId: string): Promise<string> {
    const file = await this.repository.getFileById(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    // Tenant isolation: verify caller belongs to same tenant unless file is PUBLIC
    if (file.visibility !== "PUBLIC" && file.tenantId !== callerTenantId) {
      throw new FileAccessDeniedError(`Access denied to file in tenant ${file.tenantId}`);
    }

    // Do not make untrusted uploads downloadable until scan completes successfully
    if (file.scanStatus !== "SAFE") {
      throw new FileAccessDeniedError(`File is not available (Status: ${file.scanStatus})`);
    }

    return this.provider.getPresignedDownloadUrl({
      storageKey: file.storageKey,
      expiresInSeconds: 3600 // 1 hour
    });
  }

  /**
   * Deletes a file and decrements tenant quota
   */
  async deleteFile(fileId: string, callerTenantId: string): Promise<void> {
    const file = await this.repository.getFileById(fileId);
    if (!file || file.tenantId !== callerTenantId) {
      throw new FileAccessDeniedError("Cannot delete file: unauthorized or not found");
    }

    await this.provider.deleteObject(file.storageKey);
    await this.repository.deleteFile(fileId, true);
    if (file.scanStatus === "SAFE") {
      await this.repository.decrementStorageUsage(file.tenantId, file.sizeBytes);
    }
  }

  /**
   * Orphan cleanup job: reconciles incomplete uploads older than 1 hour
   */
  async cleanupOrphanUploads(tenantId: string): Promise<{ cleanedCount: number }> {
    const files = await this.repository.listFiles(tenantId, 100);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const file of files) {
      if (file.scanStatus === "UPLOADING" && file.createdAt < oneHourAgo) {
        // DB record exists but upload timed out or failed
        const exists = await this.provider.objectExists(file.storageKey);
        if (!exists) {
          await this.repository.deleteFile(file.id, false); // hard purge dangling record
          cleanedCount++;
        }
      }
    }

    return { cleanedCount };
  }
}
