import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryStorageRepository,
  StorageService,
  sanitizeFilename,
  validateMagicBytes,
  inspectSvgSecurity,
  QuotaExceededError,
  FileAccessDeniedError,
  UnsafeFileError
} from "../server/index.js";
import type { StorageProvider, PresignedUploadParams, PresignedDownloadParams } from "../providers/index.js";

class MockStorageProvider implements StorageProvider {
  public readonly name = "mock-storage";
  public storedObjects: Set<string> = new Set();

  async getPresignedUploadUrl(params: PresignedUploadParams): Promise<{ url: string; headers: Record<string, string> }> {
    return {
      url: `https://storage.example.com/upload/${params.storageKey}?token=mock`,
      headers: { "Content-Type": params.mimeType }
    };
  }

  async getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string> {
    return `https://storage.example.com/download/${params.storageKey}?token=mock`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    this.storedObjects.delete(storageKey);
  }

  async objectExists(storageKey: string): Promise<boolean> {
    return this.storedObjects.has(storageKey);
  }
}

describe("Module 07 — File Storage & Media Processing", () => {
  let repository: InMemoryStorageRepository;
  let provider: MockStorageProvider;
  let service: StorageService;

  beforeEach(() => {
    repository = new InMemoryStorageRepository();
    provider = new MockStorageProvider();
    service = new StorageService(repository, provider);
  });

  describe("1. Security Sanitization & Inspection", () => {
    it("strips path traversal and dangerous characters from filenames", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
      expect(sanitizeFilename("image..png")).toBe("image..png");
      expect(sanitizeFilename("bad/path/file.pdf")).toBe("file.pdf");
      expect(sanitizeFilename("")).toBe("unnamed_file");
    });

    it("validates magic bytes for PNG and PDF", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(validateMagicBytes(pngBuffer, "image/png")).toBe(true);

      const fakePng = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validateMagicBytes(fakePng, "image/png")).toBe(false);

      const pdfBuffer = Buffer.from("%PDF-1.4");
      expect(validateMagicBytes(pdfBuffer, "application/pdf")).toBe(true);
    });

    it("rejects dangerous SVGs containing scripts or XML entities", () => {
      const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      expect(() => inspectSvgSecurity(safeSvg)).not.toThrow();

      const maliciousSvg = '<svg><script>alert(1)</script></svg>';
      expect(() => inspectSvgSecurity(maliciousSvg)).toThrow(UnsafeFileError);

      const onloadSvg = '<svg onload="alert(1)"></svg>';
      expect(() => inspectSvgSecurity(onloadSvg)).toThrow(UnsafeFileError);
    });
  });

  describe("2. Quota Enforcement", () => {
    it("rejects uploads exceeding per-file size limit", async () => {
      await expect(
        service.createPresignedUpload({
          tenantId: "tenant_1",
          userId: "user_1",
          filename: "huge_video.mp4",
          sizeBytes: 100 * 1024 * 1024, // 100MB > 50MB limit
          claimedMimeType: "video/mp4"
        })
      ).rejects.toThrow(QuotaExceededError);
    });
  });

  describe("3. Presigned Upload & Malware Scan Lifecycle", () => {
    it("creates presigned upload with internal object key", async () => {
      const result = await service.createPresignedUpload({
        tenantId: "tenant_1",
        userId: "user_1",
        filename: "document.pdf",
        sizeBytes: 1024 * 1024, // 1MB
        claimedMimeType: "application/pdf"
      });

      expect(result.fileId).toBeDefined();
      expect(result.storageKey).toMatch(/^tenants\/tenant_1\/files\/file_.*\.pdf$/);
      expect(result.uploadUrl).toContain(result.storageKey);

      const record = await repository.getFileById(result.fileId);
      expect(record?.scanStatus).toBe("UPLOADING");
    });

    it("prevents downloading files until scan status is SAFE", async () => {
      const upload = await service.createPresignedUpload({
        tenantId: "tenant_1",
        userId: "user_1",
        filename: "test.png",
        sizeBytes: 5000,
        claimedMimeType: "image/png"
      });

      // Still in UPLOADING -> must throw
      await expect(
        service.getPresignedDownloadUrl(upload.fileId, "tenant_1")
      ).rejects.toThrow(FileAccessDeniedError);

      // Complete upload -> SCANNING -> still must throw
      await service.completeUpload(upload.fileId);
      await expect(
        service.getPresignedDownloadUrl(upload.fileId, "tenant_1")
      ).rejects.toThrow(FileAccessDeniedError);

      // Antivirus reports clean -> SAFE -> download authorized
      await service.handleScanResult(upload.fileId, true);
      const downloadUrl = await service.getPresignedDownloadUrl(upload.fileId, "tenant_1");
      expect(downloadUrl).toBeDefined();
    });

    it("purges object from storage if malware is detected", async () => {
      const upload = await service.createPresignedUpload({
        tenantId: "tenant_1",
        userId: "user_1",
        filename: "virus.zip",
        sizeBytes: 5000,
        claimedMimeType: "application/zip"
      });

      // Simulate object in storage
      provider.storedObjects.add(upload.storageKey);
      expect(provider.storedObjects.has(upload.storageKey)).toBe(true);

      // Scan reports malicious
      await service.handleScanResult(upload.fileId, false, "Trojan signature detected");

      const record = await repository.getFileById(upload.fileId);
      expect(record?.scanStatus).toBe("REJECTED");
      expect(provider.storedObjects.has(upload.storageKey)).toBe(false); // purged!
    });
  });

  describe("4. Tenant Isolation", () => {
    it("prevents cross-tenant access to private files", async () => {
      const upload = await service.createPresignedUpload({
        tenantId: "tenant_A",
        userId: "user_a",
        filename: "secret.pdf",
        sizeBytes: 10000,
        claimedMimeType: "application/pdf"
      });

      await service.handleScanResult(upload.fileId, true);

      // Caller belongs to tenant_B -> access denied!
      await expect(
        service.getPresignedDownloadUrl(upload.fileId, "tenant_B")
      ).rejects.toThrow(FileAccessDeniedError);
    });
  });
});
