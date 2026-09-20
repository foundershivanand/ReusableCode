import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@libsql/client";
import { TursoStorageService } from "../service.js";
import {
  verifyCredentials,
  generateToken,
  verifyToken,
  authenticateRequest,
} from "../auth.js";
import {
  determineCategory,
  determineMimeType,
  isBufferBinary,
  computeSha256,
} from "../utils.js";
import { TursoStorageAdapter } from "../../storage/providers/turso-adapter.js";
import type { IncomingMessage } from "node:http";

describe("Turso File Storage Service", () => {
  let db: ReturnType<typeof createClient>;
  let service: TursoStorageService;

  beforeEach(async () => {
    // Use an in-memory or temporary SQLite database for isolated testing
    db = createClient({ url: ":memory:" });
    service = new TursoStorageService(db);
    await service.initialize();
  });

  afterEach(() => {
    db.close();
  });

  it("should initialize database tables and indexes", async () => {
    const tableRes = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='turso_files';"
    );
    expect(tableRes.rows.length).toBe(1);
    expect(tableRes.rows[0].name).toBe("turso_files");
  });

  it("should correctly identify categories, MIME types, and binary status", () => {
    expect(determineCategory("src/index.ts", ".ts")).toBe("code");
    expect(determineCategory("docs/whitepaper.pdf", ".pdf")).toBe("pdf");
    expect(determineCategory("README.md", ".md")).toBe("document");
    expect(determineCategory("assets/logo.png", ".png")).toBe("image");

    expect(determineMimeType("doc.pdf", ".pdf", true)).toBe("application/pdf");
    expect(determineMimeType("code.ts", ".ts", false)).toBe("application/typescript");

    const textBuffer = Buffer.from("console.log('hello world');");
    expect(isBufferBinary(textBuffer)).toBe(false);

    const binaryBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0x01]); // PDF header with null byte
    expect(isBufferBinary(binaryBuffer)).toBe(true);
  });

  it("should store and retrieve code files (text content)", async () => {
    const codeContent = "export function add(a: number, b: number) { return a + b; }";
    const buffer = Buffer.from(codeContent, "utf-8");

    const res = await service.upsertFile({
      path: "src/math.ts",
      buffer,
    });

    expect(res.status).toBe("inserted");
    expect(res.sha256).toBe(computeSha256(buffer));

    const retrieved = await service.getFileByPath("src/math.ts");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.path).toBe("src/math.ts");
    expect(retrieved?.category).toBe("code");
    expect(retrieved?.content_text).toBe(codeContent);
    expect(retrieved?.is_binary).toBe(0);
  });

  it("should store and retrieve PDF files (binary BLOB)", async () => {
    // Simulated PDF file content with binary bytes
    const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj\n<<\n>>\nstream\n\x00\x01\x02\x03\nendstream\nendobj\n%%EOF");

    const res = await service.upsertFile({
      path: "documents/manual.pdf",
      buffer: pdfBytes,
    });

    expect(res.status).toBe("inserted");

    const retrieved = await service.getFileByPath("documents/manual.pdf");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.category).toBe("pdf");
    expect(retrieved?.mime_type).toBe("application/pdf");
    expect(retrieved?.is_binary).toBe(1);
    expect(retrieved?.content_blob).not.toBeNull();
    expect(retrieved?.content_blob?.toString("hex")).toBe(pdfBytes.toString("hex"));
  });

  it("should skip duplicate files with same SHA256 and update if changed", async () => {
    const buffer = Buffer.from("const version = 1;");
    const res1 = await service.upsertFile({ path: "config.ts", buffer });
    expect(res1.status).toBe("inserted");

    // Re-upserting same content -> skipped
    const res2 = await service.upsertFile({ path: "config.ts", buffer });
    expect(res2.status).toBe("skipped");

    // Re-upserting modified content -> updated
    const updatedBuffer = Buffer.from("const version = 2;");
    const res3 = await service.upsertFile({ path: "config.ts", buffer: updatedBuffer });
    expect(res3.status).toBe("updated");

    const retrieved = await service.getFileByPath("config.ts");
    expect(retrieved?.content_text).toBe("const version = 2;");
  });

  it("should list and filter files with pagination and search", async () => {
    await service.upsertFile({ path: "src/a.ts", buffer: Buffer.from("a") });
    await service.upsertFile({ path: "src/b.ts", buffer: Buffer.from("b") });
    await service.upsertFile({ path: "docs/spec.pdf", buffer: Buffer.from("%PDF\x00") });

    const all = await service.listFiles();
    expect(all.total).toBe(3);

    const codeOnly = await service.listFiles({ category: "code" });
    expect(codeOnly.total).toBe(2);

    const pdfOnly = await service.listFiles({ category: "pdf" });
    expect(pdfOnly.total).toBe(1);
    expect(pdfOnly.files[0].path).toBe("docs/spec.pdf");

    const searchResult = await service.listFiles({ search: "spec" });
    expect(searchResult.total).toBe(1);
  });

  it("should compute accurate storage statistics", async () => {
    await service.upsertFile({ path: "src/a.ts", buffer: Buffer.from("12345") });
    await service.upsertFile({ path: "doc.pdf", buffer: Buffer.from("%PDF\x0012345") });

    const stats = await service.getStats();
    expect(stats.totalFiles).toBe(2);
    expect(stats.categoryBreakdown.code).toBe(1);
    expect(stats.categoryBreakdown.pdf).toBe(1);
    expect(stats.totalSizeBytes).toBe(15);
  });

  it("should delete stored files", async () => {
    await service.upsertFile({ path: "temp.txt", buffer: Buffer.from("temp") });
    const deleted = await service.deleteFile({ path: "temp.txt" });
    expect(deleted).toBe(true);

    const check = await service.getFileByPath("temp.txt");
    expect(check).toBeNull();
  });
});

describe("Authentication & Credentials", () => {
  it("should verify valid username and password credentials", () => {
    expect(verifyCredentials("admin", "admin123")).toBe(true);
    expect(verifyCredentials("admin", "wrongpassword")).toBe(false);
    expect(verifyCredentials("wronguser", "admin123")).toBe(false);
    expect(verifyCredentials("", "")).toBe(false);
  });

  it("should generate and verify session tokens", () => {
    const token = generateToken("admin");
    const auth = verifyToken(token);
    expect(auth.authenticated).toBe(true);
    expect(auth.username).toBe("admin");

    const invalidAuth = verifyToken("invalid.token.here");
    expect(invalidAuth.authenticated).toBe(false);
  });

  it("should authenticate HTTP requests via Basic auth and Bearer token", () => {
    // Basic Auth
    const basicHeader = "Basic " + Buffer.from("admin:admin123").toString("base64");
    const req1 = {
      headers: { authorization: basicHeader },
    } as unknown as IncomingMessage;
    expect(authenticateRequest(req1).authenticated).toBe(true);

    // Bearer Token
    const token = generateToken("admin");
    const req2 = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as IncomingMessage;
    expect(authenticateRequest(req2).authenticated).toBe(true);

    // Cookie
    const req3 = {
      headers: { cookie: `auth_token=${token}` },
    } as unknown as IncomingMessage;
    expect(authenticateRequest(req3).authenticated).toBe(true);

    // Unauthorized
    const req4 = {
      headers: {},
    } as unknown as IncomingMessage;
    expect(authenticateRequest(req4).authenticated).toBe(false);
  });
});

describe("Storage Module Integration (TursoStorageAdapter)", () => {
  it("should conform to StorageProvider interface", async () => {
    const db = createClient({ url: ":memory:" });
    const service = new TursoStorageService(db);
    const adapter = new TursoStorageAdapter({ service });
    await adapter.initialize();

    expect(adapter.name).toBe("turso");

    await adapter.storeFile("test.ts", Buffer.from("console.log('ok');"));
    const exists = await adapter.objectExists("test.ts");
    expect(exists).toBe(true);

    const downloadUrl = await adapter.getPresignedDownloadUrl({ storageKey: "test.ts" });
    expect(downloadUrl).toContain("/api/files/");
    expect(downloadUrl).toContain("/download?token=");

    await adapter.deleteObject("test.ts");
    const existsAfter = await adapter.objectExists("test.ts");
    expect(existsAfter).toBe(false);

    db.close();
  });
});

describe("Security & Launch Hardening", () => {
  it("should strictly reject path traversal and secret file paths", async () => {
    const { shouldIgnore } = await import("../utils.ts");

    // Must ignore all .env variants except .env.example
    expect(shouldIgnore(".env")).toBe(true);
    expect(shouldIgnore("nested/.env")).toBe(true);
    expect(shouldIgnore(".env.local")).toBe(true);
    expect(shouldIgnore(".env.production")).toBe(true);
    expect(shouldIgnore(".env.example")).toBe(false);

    // Must ignore secret key files
    expect(shouldIgnore("id_rsa")).toBe(true);
    expect(shouldIgnore("server.key")).toBe(true);
    expect(shouldIgnore("cert.pem")).toBe(true);
    expect(shouldIgnore("credentials.json")).toBe(true);

    // Normal files should not be ignored
    expect(shouldIgnore("src/app.ts")).toBe(false);
    expect(shouldIgnore("docs/guide.pdf")).toBe(false);
  });
});

