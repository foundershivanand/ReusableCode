# 10 — File Storage API Reference

## 1. StorageService Methods
- `createPresignedUpload(request: PresignedUploadRequest): Promise<PresignedUploadResult>`
- `completeUpload(fileId: string): Promise<FileRecord>`
- `handleScanResult(fileId: string, isClean: boolean, lastError?: string): Promise<void>`
- `getPresignedDownloadUrl(fileId: string, callerTenantId: string): Promise<string>`
- `deleteFile(fileId: string, callerTenantId: string): Promise<void>`
- `cleanupOrphanUploads(tenantId: string): Promise<{ cleanedCount: number }>`

## 2. Utility Functions
- `sanitizeFilename(raw: string): string`
- `validateMagicBytes(headerBytes: Buffer, claimedMime: string): boolean`
- `inspectSvgSecurity(svgContent: string): void`

## 3. Client SDK & Hooks
- `useFiles()`: `{ files, loading, error, refreshFiles, deleteFile }`
- `useFileUpload()`: `{ uploadFile, quota }`
