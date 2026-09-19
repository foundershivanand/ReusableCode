import { describe, it, expect, beforeEach } from "vitest";
import { ApiKeyService } from "../server/api-key-service.js";
import { WebhookService } from "../server/webhook-service.js";
import { InMemoryWebhookRepository } from "../server/repository.js";

describe("Module 18: Webhook Engine & Public API Key Management", () => {
  let repository: InMemoryWebhookRepository;
  let apiKeyService: ApiKeyService;
  let webhookService: WebhookService;

  beforeEach(() => {
    repository = new InMemoryWebhookRepository();
    apiKeyService = new ApiKeyService(repository);
    webhookService = new WebhookService(repository);
  });

  describe("API Key Management", () => {
    it("generates API key, hashes at rest, and returns raw key only once", async () => {
      const { apiKey, rawKey } = await apiKeyService.generateApiKey({
        tenantId: "t_1",
        userId: "u_admin",
        name: "Test Key",
        scopes: ["read:projects", "write:projects"],
        rateLimitPerMinute: 60
      });

      expect(apiKey.id).toBeDefined();
      expect(apiKey.prefix).toBeDefined();
      expect(rawKey.startsWith("pk_live_")).toBe(true);

      // Stored key has SHA-256 hash, NOT raw key!
      expect(apiKey.keyHash).not.toBe(rawKey);
      expect(apiKey.keyHash.length).toBe(64); // SHA-256 hex length
    });

    it("enforces scope hierarchy and prevents privilege escalation", async () => {
      // Creator only has read:projects
      await expect(
        apiKeyService.generateApiKey(
          {
            tenantId: "t_1",
            userId: "u_member",
            name: "Escalated Key",
            scopes: ["write:projects", "admin:all"]
          },
          ["read:projects"] // Creator allowed scopes
        )
      ).rejects.toThrow(/Scope hierarchy violation/);
    });

    it("authenticates valid keys and updates lastUsed timestamp", async () => {
      const { rawKey } = await apiKeyService.generateApiKey({
        tenantId: "t_1",
        userId: "u_admin",
        name: "Auth Key",
        scopes: ["read:projects"],
        rateLimitPerMinute: 60
      });

      const authenticated = await apiKeyService.authenticateKey(rawKey, "read:projects", {
        ip: "203.0.113.195",
        userAgent: "curl/7.88"
      });

      expect(authenticated.lastUsedAt).toBeDefined();
      expect(authenticated.lastUsedIp).toBe("203.0.113.195");
    });

    it("rejects authentication when required scope is missing", async () => {
      const { rawKey } = await apiKeyService.generateApiKey({
        tenantId: "t_1",
        userId: "u_admin",
        name: "Read-Only Key",
        scopes: ["read:projects"]
      });

      await expect(
        apiKeyService.authenticateKey(rawKey, "write:projects")
      ).rejects.toThrow(/lacks required scope/);
    });

    it("rotates API key with overlapping grace period", async () => {
      const { apiKey: oldKey, rawKey: oldRaw } = await apiKeyService.generateApiKey({
        tenantId: "t_1",
        userId: "u_admin",
        name: "Key To Rotate",
        scopes: ["read:projects"]
      });

      const { newApiKey, rawKey: newRaw } = await apiKeyService.rotateApiKey(oldKey.id, 24);

      expect(newApiKey.id).not.toBe(oldKey.id);
      expect(newRaw).not.toBe(oldRaw);

      // Old key is marked ROTATED but still authenticates during grace period
      const oldAuth = await apiKeyService.authenticateKey(oldRaw, "read:projects");
      expect(oldAuth.lifecycleState).toBe("ROTATED");

      // New key authenticates as ACTIVE
      const newAuth = await apiKeyService.authenticateKey(newRaw, "read:projects");
      expect(newAuth.lifecycleState).toBe("ACTIVE");
    });
  });

  describe("Webhook Engine", () => {
    it("blocks SSRF attempts on private and metadata IP addresses", async () => {
      await expect(
        webhookService.registerEndpoint({
          tenantId: "t_1",
          url: "http://localhost:8080/webhook",
          eventTypes: ["*"]
        })
      ).rejects.toThrow(/SSRF violation/);

      await expect(
        webhookService.registerEndpoint({
          tenantId: "t_1",
          url: "http://169.254.169.254/latest/meta-data/",
          eventTypes: ["*"]
        })
      ).rejects.toThrow(/SSRF violation/);

      await expect(
        webhookService.registerEndpoint({
          tenantId: "t_1",
          url: "http://192.168.1.1/webhook",
          eventTypes: ["*"]
        })
      ).rejects.toThrow(/SSRF violation/);
    });

    it("registers valid public webhook endpoint and generates HMAC secret", async () => {
      const ep = await webhookService.registerEndpoint({
        tenantId: "t_1",
        url: "https://api.external-partner.com/webhook",
        eventTypes: ["invoice.paid", "user.created"]
      });

      expect(ep.id).toBeDefined();
      expect(ep.secret.startsWith("whsec_")).toBe(true);
      expect(ep.status).toBe("ACTIVE");
    });

    it("computes and verifies HMAC SHA-256 signatures and checks timestamp replay tolerance", async () => {
      const ep = await webhookService.registerEndpoint({
        tenantId: "t_1",
        url: "https://api.external-partner.com/webhook",
        eventTypes: ["*"]
      });

      const payload = JSON.stringify({ event: "invoice.paid", amount: 5000 });
      const now = Math.floor(Date.now() / 1000);
      const signature = webhookService.computeSignature(payload, ep.secret, now);

      // Valid signature verifies
      const isValid = webhookService.verifySignature(payload, ep.secret, signature);
      expect(isValid).toBe(true);

      // Tampered payload fails
      const isTamperedValid = webhookService.verifySignature(
        JSON.stringify({ event: "invoice.paid", amount: 999999 }),
        ep.secret,
        signature
      );
      expect(isTamperedValid).toBe(false);

      // Replay attack with expired timestamp (older than 300 seconds) fails
      const expiredSignature = webhookService.computeSignature(payload, ep.secret, now - 500);
      const isExpiredValid = webhookService.verifySignature(payload, ep.secret, expiredSignature);
      expect(isExpiredValid).toBe(false);
    });

    it("handles delivery isolation and transitions failing endpoints to DEAD_LETTER", async () => {
      const ep = await webhookService.registerEndpoint({
        tenantId: "t_fail",
        url: "https://api.partner.com/webhook",
        eventTypes: ["project.created"]
      });

      // Simulate 5 consecutive 500 failures
      for (let i = 0; i < 5; i++) {
        await webhookService.dispatchEvent(
          "t_fail",
          "project.created",
          { projectId: "p1" },
          async () => ({ status: 500, text: "Internal Server Error" })
        );
      }

      const updatedEp = await repository.getEndpointById(ep.id);
      expect(updatedEp?.consecutiveFailures).toBe(5);
      expect(updatedEp?.status).toBe("DEAD_LETTER");
    });
  });
});
