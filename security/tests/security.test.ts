import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySecurityRepository,
  SecurityService,
  validateSafeExternalUrl,
  isPrivateOrReservedIp,
  normalizeRequest,
  getSecurityHeaders,
  normalizeErrorResponse,
  SsrfError,
  RequestSmugglingError
} from "../server/index.js";

describe("Module 09 — Rate Limiting, Security & API Protection", () => {
  let repository: InMemorySecurityRepository;
  let service: SecurityService;

  beforeEach(() => {
    repository = new InMemorySecurityRepository();
    service = new SecurityService(repository);
  });

  describe("1. SSRF Protection", () => {
    it("blocks loopback and localhost addresses", () => {
      expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIp("::1")).toBe(true);

      expect(() => validateSafeExternalUrl("http://localhost:8080/admin")).toThrow(SsrfError);
      expect(() => validateSafeExternalUrl("http://127.0.0.1:3000/keys")).toThrow(SsrfError);
    });

    it("blocks RFC 1918 private IP ranges", () => {
      expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIp("172.16.0.5")).toBe(true);
      expect(isPrivateOrReservedIp("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);

      expect(() => validateSafeExternalUrl("http://192.168.1.1/router")).toThrow(SsrfError);
      expect(() => validateSafeExternalUrl("http://10.0.0.5/internal")).toThrow(SsrfError);
    });

    it("blocks cloud metadata service (169.254.169.254)", () => {
      expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
      expect(() => validateSafeExternalUrl("http://169.254.169.254/latest/meta-data/")).toThrow(SsrfError);
      expect(() => validateSafeExternalUrl("http://metadata.google.internal/computeMetadata/v1/")).toThrow(SsrfError);
    });

    it("allows valid public HTTPS destinations", () => {
      expect(() => validateSafeExternalUrl("https://api.github.com/users")).not.toThrow();
      expect(() => validateSafeExternalUrl("https://example.com/webhook")).not.toThrow();
    });
  });

  describe("2. Request Normalization & Smuggling Defense", () => {
    it("normalizes path slashes and Unicode characters", () => {
      const normalized = normalizeRequest(
        "get",
        "/api//v1///users/%E2%84%AB", // Å (Angstrom sign)
        { "Host": "api.example.com" },
        "203.0.113.1"
      );

      expect(normalized.method).toBe("GET");
      expect(normalized.normalizedPath).toBe("/api/v1/users/Å");
    });

    it("detects and rejects HTTP request smuggling headers", () => {
      // Both Content-Length and Transfer-Encoding present
      expect(() =>
        normalizeRequest(
          "POST",
          "/api/v1/resource",
          {
            "Content-Length": "42",
            "Transfer-Encoding": "chunked"
          },
          "203.0.113.1"
        )
      ).toThrow(RequestSmugglingError);
    });
  });

  describe("3. Sliding Window Rate Limiting", () => {
    it("allows requests under the limit and blocks when exceeded", async () => {
      const config = {
        scope: "LOGIN" as const,
        algorithm: "SLIDING_WINDOW" as const,
        maxRequests: 3,
        windowSeconds: 60,
        blockDurationSeconds: 0
      };

      const res1 = await service.checkRateLimit("user_ip_1", "LOGIN", config);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = await service.checkRateLimit("user_ip_1", "LOGIN", config);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = await service.checkRateLimit("user_ip_1", "LOGIN", config);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);

      // 4th request exceeds limit
      const res4 = await service.checkRateLimit("user_ip_1", "LOGIN", config);
      expect(res4.allowed).toBe(false);
      expect(res4.remaining).toBe(0);
      expect(res4.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("4. Security Headers & Error Normalization", () => {
    it("generates defense-in-depth security headers", () => {
      const headers = getSecurityHeaders();
      expect(headers.contentSecurityPolicy).toContain("frame-ancestors 'none'");
      expect(headers.strictTransportSecurity).toContain("max-age=63072000");
      expect(headers.xContentTypeOptions).toBe("nosniff");
      expect(headers.xFrameOptions).toBe("DENY");
    });

    it("sanitizes internal errors and prevents stack trace leakage", () => {
      const internalErr = new Error("Connection failed at postgres://user:secretpass@db.internal:5432/prod");
      const normalized = normalizeErrorResponse(internalErr, "req_123");

      expect(normalized.error).toBe("An unexpected server error occurred");
      expect(normalized.code).toBe("INTERNAL_SERVER_ERROR");
      expect(normalized.requestId).toBe("req_123");
      expect(JSON.stringify(normalized)).not.toContain("secretpass");
    });
  });
});
