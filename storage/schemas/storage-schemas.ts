import { z } from "zod";

export const StorageProviderTypeSchema = z.enum(["S3", "CLOUDFLARE_R2", "UPLOADTHING", "LOCAL"]);
export type StorageProviderType = z.infer<typeof StorageProviderTypeSchema>;

export const FileScanStatusSchema = z.enum(["UPLOADING", "SCANNING", "SAFE", "REJECTED"]);
export type FileScanStatus = z.infer<typeof FileScanStatusSchema>;

export const FileVisibilitySchema = z.enum(["PRIVATE", "PUBLIC", "ORGANIZATION"]);
export type FileVisibility = z.infer<typeof FileVisibilitySchema>;

export const FileRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  originalName: z.string().min(1).max(255),
  sanitizedName: z.string().min(1).max(255),
  storageKey: z.string().min(1), // internal object ID: tenantId/files/uuid.ext
  sizeBytes: z.number().int().min(0),
  mimeType: z.string().min(1),
  extension: z.string().min(1),
  visibility: FileVisibilitySchema.default("PRIVATE"),
  scanStatus: FileScanStatusSchema.default("SCANNING"),
  etag: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional()
});
export type FileRecord = z.infer<typeof FileRecordSchema>;

export const PresignedUploadRequestSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().min(1),
  claimedMimeType: z.string().min(1),
  visibility: FileVisibilitySchema.optional().default("PRIVATE")
});
export type PresignedUploadRequest = z.output<typeof PresignedUploadRequestSchema>;
export type PresignedUploadInput = z.input<typeof PresignedUploadRequestSchema>;

export const PresignedUploadResultSchema = z.object({
  fileId: z.string().min(1),
  storageKey: z.string().min(1),
  uploadUrl: z.string().url(),
  expiresAt: z.date(),
  headers: z.record(z.string(), z.string())
});
export type PresignedUploadResult = z.infer<typeof PresignedUploadResultSchema>;

export const StorageQuotaSchema = z.object({
  tenantId: z.string().min(1),
  usedBytes: z.number().int().min(0),
  maxBytes: z.number().int().min(0), // e.g. 50 GB
  maxFileSizeBytes: z.number().int().min(0) // e.g. 50 MB
});
export type StorageQuota = z.infer<typeof StorageQuotaSchema>;
