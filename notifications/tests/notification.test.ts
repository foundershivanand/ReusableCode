import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryNotificationRepository,
  NotificationService,
  TemplateEngine,
  NotificationSuppressedError
} from "../server/index.js";
import type { NotificationProvider, EmailMessage, ProviderSendResult } from "../providers/index.js";

class MockProvider implements NotificationProvider {
  public sentMessages: EmailMessage[] = [];
  public shouldFail = false;

  constructor(public readonly name: string) {}

  async sendEmail(message: EmailMessage): Promise<ProviderSendResult> {
    if (this.shouldFail) {
      throw new Error(`${this.name} API connection error`);
    }
    this.sentMessages.push(message);
    return {
      provider: this.name,
      messageId: `${this.name}_${Date.now()}`,
      status: "SENT"
    };
  }
}

describe("Module 04 — Transactional Email & Notification Center", () => {
  let repository: InMemoryNotificationRepository;
  let primaryProvider: MockProvider;
  let fallbackProvider: MockProvider;
  let service: NotificationService;

  beforeEach(() => {
    repository = new InMemoryNotificationRepository();
    primaryProvider = new MockProvider("mock-primary");
    fallbackProvider = new MockProvider("mock-fallback");
    service = new NotificationService(repository, primaryProvider, fallbackProvider);
  });

  describe("1. Template Engine & Security", () => {
    it("escapes user input in templates to prevent XSS and template injection", () => {
      const engine = new TemplateEngine();
      const rendered = engine.render("welcome_email", {
        name: "<script>alert('xss')</script>",
        appName: "MyApp & Co"
      });

      expect(rendered.html).not.toContain("<script>");
      expect(rendered.html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
      expect(rendered.html).toContain("MyApp &amp; Co");
    });

    it("rejects unsafe URLs in action emails", () => {
      const engine = new TemplateEngine();
      expect(() =>
        engine.render("verification_email", {
          verificationUrl: "javascript:alert(1)"
        })
      ).toThrow("Unsafe or malformed URL");
    });
  });

  describe("2. Idempotency & Deduplication", () => {
    it("returns existing notification when identical idempotencyKey is supplied", async () => {
      const payload = {
        userId: "user_1",
        recipientAddress: "user1@example.com",
        channel: "EMAIL" as const,
        template: "welcome_email" as const,
        category: "TRANSACTIONAL" as const,
        data: { name: "Alice" },
        idempotencyKey: "unique-key-123"
      };

      const first = await service.sendNotification(payload);
      const second = await service.sendNotification(payload);

      expect(first.id).toBe(second.id);
      expect(primaryProvider.sentMessages.length).toBe(1);
    });
  });

  describe("3. Unsubscribe Semantics & Preferences", () => {
    it("cancels marketing emails if user has not opted in", async () => {
      // Default preferences: marketingEmails = false
      const result = await service.sendNotification({
        userId: "user_marketing_test",
        recipientAddress: "user@example.com",
        channel: "EMAIL",
        template: "welcome_email",
        category: "MARKETING",
        data: { name: "Bob" }
      });

      expect(result.status).toBe("CANCELED");
      expect(primaryProvider.sentMessages.length).toBe(0);
    });

    it("never cancels security emails even if user disabled all email notifications", async () => {
      await repository.updatePreferences("user_sec_test", {
        emailNotifications: false,
        marketingEmails: false
      });

      const result = await service.sendNotification({
        userId: "user_sec_test",
        recipientAddress: "user@example.com",
        channel: "EMAIL",
        template: "password_reset",
        category: "SECURITY",
        data: { resetUrl: "https://example.com/reset?token=abc" }
      });

      expect(result.status).toBe("SENT");
      expect(primaryProvider.sentMessages.length).toBe(1);
    });
  });

  describe("4. Suppression List & Bounce Handling", () => {
    it("rejects sends to hard-bounced addresses", async () => {
      await service.handleBounceWebhook("bounced@example.com", "hard");

      await expect(
        service.sendNotification({
          userId: "user_bounce",
          recipientAddress: "bounced@example.com",
          channel: "EMAIL",
          template: "welcome_email",
          category: "TRANSACTIONAL",
          data: { name: "Charlie" }
        })
      ).rejects.toThrow(NotificationSuppressedError);

      expect(primaryProvider.sentMessages.length).toBe(0);
    });
  });

  describe("5. Provider Failover", () => {
    it("fails over to secondary provider when primary fails", async () => {
      primaryProvider.shouldFail = true;

      const result = await service.sendNotification({
        userId: "user_failover",
        recipientAddress: "failover@example.com",
        channel: "EMAIL",
        template: "system_alert",
        category: "TRANSACTIONAL",
        data: { message: "Failover test" }
      });

      expect(result.status).toBe("SENT");
      expect(result.provider).toBe("mock-fallback");
      expect(fallbackProvider.sentMessages.length).toBe(1);
    });
  });

  describe("6. In-App Notifications", () => {
    it("creates, retrieves, and marks in-app notifications as read", async () => {
      await service.sendNotification({
        userId: "user_in_app",
        recipientAddress: "user_in_app",
        channel: "IN_APP",
        template: "system_alert",
        category: "TRANSACTIONAL",
        data: { message: "You have a new message" }
      });

      const list = await repository.listInAppNotifications("user_in_app");
      expect(list.length).toBe(1);
      expect(list[0].status).toBe("DELIVERED");
      expect(list[0].readAt).toBeFalsy();

      await repository.markAsRead(list[0].id);
      const updated = await repository.listInAppNotifications("user_in_app");
      expect(updated[0].readAt).toBeDefined();
    });
  });
});
