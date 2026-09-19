import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryAnalyticsRepository,
  AnalyticsService,
  StructuredLogger,
  redactSensitiveData
} from "../server/index.js";
import type { AnalyticsProvider } from "../providers/index.js";
import type { AnalyticsEvent } from "../schemas/index.js";

class MockAnalyticsProvider implements AnalyticsProvider {
  public readonly name = "mock-analytics";
  public trackedEvents: AnalyticsEvent[] = [];
  public shouldFail = false;

  async track(event: AnalyticsEvent): Promise<void> {
    if (this.shouldFail) throw new Error("Upstream analytics failure");
    this.trackedEvents.push(event);
  }

  async identify(_userId: string, _traits: Record<string, any>): Promise<void> {}
  async page(_userId: string | undefined, _path: string, _referrer?: string): Promise<void> {}
}

describe("Module 08 — Analytics, Event Tracking & Logging", () => {
  let repository: InMemoryAnalyticsRepository;
  let provider: MockAnalyticsProvider;
  let service: AnalyticsService;
  let logger: StructuredLogger;

  beforeEach(() => {
    repository = new InMemoryAnalyticsRepository();
    provider = new MockAnalyticsProvider();
    service = new AnalyticsService(repository, provider);
    logger = new StructuredLogger(repository, 1.0);
  });

  describe("1. PII Redaction & Secret Stripping", () => {
    it("redacts sensitive fields recursively from metadata", () => {
      const payload = {
        userId: "123",
        password: "supersecretpassword",
        authToken: "bearer xyz",
        nested: {
          apiKey: "sk-12345",
          creditCard: "4111111111111111",
          safeField: "ok"
        }
      };

      const redacted = redactSensitiveData(payload);
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.authToken).toBe("[REDACTED]");
      expect(redacted.nested.apiKey).toBe("[REDACTED]");
      expect(redacted.nested.creditCard).toBe("[REDACTED]");
      expect(redacted.nested.safeField).toBe("ok");
    });
  });

  describe("2. Event Governance & Consent", () => {
    it("drops events when user consent is not given", async () => {
      const result = await service.trackEvent({
        eventVersion: "checkout.completed.v1",
        eventName: "checkout_completed",
        consentGiven: false,
        properties: { amount: 100 }
      });

      expect(result).toBeNull();
      expect(provider.trackedEvents.length).toBe(0);
    });

    it("ingests versioned events when consent is granted", async () => {
      const result = await service.trackEvent({
        eventVersion: "user.signed_up.v1",
        eventName: "user_signed_up",
        consentGiven: true,
        properties: { plan: "pro", secretToken: "sensitive" }
      });

      expect(result).not.toBeNull();
      expect(result?.eventVersion).toBe("user.signed_up.v1");
      expect(result?.properties.secretToken).toBe("[REDACTED]");
      expect(provider.trackedEvents.length).toBe(1);
    });

    it("deduplicates identical events using idempotencyKey", async () => {
      const payload = {
        eventVersion: "order.placed.v1",
        eventName: "order_placed",
        consentGiven: true,
        idempotencyKey: "order_unique_key_1",
        properties: { orderId: "ord_1" }
      };

      const first = await service.trackEvent(payload);
      const second = await service.trackEvent(payload);

      expect(first?.id).toBe(second?.id);
      expect(provider.trackedEvents.length).toBe(1);
    });

    it("does not throw when upstream analytics provider fails", async () => {
      provider.shouldFail = true;

      await expect(
        service.trackEvent({
          eventVersion: "test.event.v1",
          eventName: "test_event",
          consentGiven: true,
          properties: {}
        })
      ).resolves.not.toThrow();
    });
  });

  describe("3. Structured Application Logging", () => {
    it("logs INFO and ERROR entries with context and redaction", async () => {
      await logger.info("User requested password reset", {
        userId: "u_1",
        requestId: "req_abc",
        extra: { token: "secret_reset_token" }
      });

      await logger.error("Database connection timeout", new Error("DB Error"), {
        requestId: "req_abc"
      });

      const logs = await repository.listLogs();
      expect(logs.length).toBe(2);

      const infoLog = logs.find((l) => l.level === "INFO");
      expect(infoLog?.context.extra?.token).toBe("[REDACTED]");

      const errorLog = logs.find((l) => l.level === "ERROR");
      expect(errorLog?.errorStack).toBeDefined();
    });
  });
});
