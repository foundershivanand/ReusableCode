import type { NotificationRepository } from "./repository.js";
import type { NotificationProvider } from "../providers/notification-provider.js";
import {
  type NotificationRecord,
  type NotificationInput,
  type NotificationPayload,
  NotificationPayloadSchema
} from "../schemas/index.js";
import { TemplateEngine } from "./template-engine.js";

export class NotificationSuppressedError extends Error {
  public readonly code = "RECIPIENT_SUPPRESSED";
  constructor(address: string) {
    super(`Recipient address "${address}" is on the suppression list`);
    this.name = "NotificationSuppressedError";
  }
}

export class NotificationService {
  private templateEngine: TemplateEngine;

  constructor(
    private repository: NotificationRepository,
    private primaryProvider?: NotificationProvider,
    private fallbackProvider?: NotificationProvider,
    templateEngine?: TemplateEngine
  ) {
    this.templateEngine = templateEngine || new TemplateEngine();
  }

  /**
   * Sends a notification across email, in-app, push, or webhook channels.
   * Guarantees idempotency, respects unsubscribe preferences, and enforces security rules.
   */
  async sendNotification(input: NotificationInput): Promise<NotificationRecord> {
    const payload = NotificationPayloadSchema.parse(input);
    // 1. Idempotency Check
    if (payload.idempotencyKey) {
      const existing = await this.repository.findNotificationByIdempotencyKey(payload.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 2. Unsubscribe & Preferences Check
    const prefs = await this.repository.getPreferences(payload.userId);

    // SECURITY and LEGAL notifications CANNOT be unsubscribed!
    if (payload.category === "MARKETING" && !prefs.marketingEmails) {
      // User opted out of marketing
      const record: NotificationRecord = {
        id: `notif_${crypto.randomUUID()}`,
        userId: payload.userId,
        tenantId: payload.tenantId,
        recipientAddress: payload.recipientAddress,
        channel: payload.channel,
        template: payload.template,
        category: payload.category,
        data: payload.data,
        priority: payload.priority,
        status: "CANCELED",
        idempotencyKey: payload.idempotencyKey,
        attempts: 0,
        maxAttempts: 3,
        lastError: "User unsubscribed from marketing messages",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return this.repository.createNotification(record);
    }

    // Channel specific toggle (only applies to TRANSACTIONAL and MARKETING)
    if (payload.category !== "SECURITY" && payload.category !== "LEGAL") {
      if (payload.channel === "EMAIL" && !prefs.emailNotifications) {
        return this.createCanceledRecord(payload, "User disabled email notifications");
      }
      if (payload.channel === "IN_APP" && !prefs.inAppNotifications) {
        return this.createCanceledRecord(payload, "User disabled in-app notifications");
      }
      if (payload.channel === "PUSH" && !prefs.pushNotifications) {
        return this.createCanceledRecord(payload, "User disabled push notifications");
      }
    }

    // 3. Suppression List Check (e.g. hard bounces, spam complaints)
    const isSuppressed = await this.repository.isSuppressed(payload.recipientAddress, payload.channel);
    if (isSuppressed) {
      const record: NotificationRecord = {
        id: `notif_${crypto.randomUUID()}`,
        userId: payload.userId,
        tenantId: payload.tenantId,
        recipientAddress: payload.recipientAddress,
        channel: payload.channel,
        template: payload.template,
        category: payload.category,
        data: payload.data,
        priority: payload.priority,
        status: "BOUNCED",
        idempotencyKey: payload.idempotencyKey,
        attempts: 0,
        maxAttempts: 3,
        lastError: `Recipient address "${payload.recipientAddress}" is suppressed`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.repository.createNotification(record);
      throw new NotificationSuppressedError(payload.recipientAddress);
    }

    // 4. Create Initial Record in QUEUED state
    const now = new Date();
    const record: NotificationRecord = {
      id: `notif_${crypto.randomUUID()}`,
      userId: payload.userId,
      tenantId: payload.tenantId,
      recipientAddress: payload.recipientAddress,
      channel: payload.channel,
      template: payload.template,
      category: payload.category,
      data: payload.data,
      priority: payload.priority,
      status: "QUEUED",
      idempotencyKey: payload.idempotencyKey,
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      updatedAt: now
    };

    await this.repository.createNotification(record);

    // 5. In-App Notifications are delivered immediately
    if (payload.channel === "IN_APP") {
      await this.repository.updateNotificationStatus(record.id, "DELIVERED", undefined, new Date());
      record.status = "DELIVERED";
      record.deliveredAt = new Date();
      return record;
    }

    // 6. Email Channel Delivery with Provider Failover
    if (payload.channel === "EMAIL") {
      await this.deliverEmailWithFailover(record, payload);
    }

    const updated = await this.repository.getNotificationById(record.id);
    return updated || record;
  }

  private async createCanceledRecord(payload: NotificationPayload, reason: string): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      id: `notif_${crypto.randomUUID()}`,
      userId: payload.userId,
      tenantId: payload.tenantId,
      recipientAddress: payload.recipientAddress,
      channel: payload.channel,
      template: payload.template,
      category: payload.category,
      data: payload.data,
      priority: payload.priority,
      status: "CANCELED",
      idempotencyKey: payload.idempotencyKey,
      attempts: 0,
      maxAttempts: 3,
      lastError: reason,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.repository.createNotification(record);
  }

  private async deliverEmailWithFailover(record: NotificationRecord, payload: NotificationPayload): Promise<void> {
    await this.repository.updateNotificationStatus(record.id, "PROCESSING");
    const rendered = this.templateEngine.render(payload.template, payload.data, payload.locale);

    const emailMsg = {
      to: payload.recipientAddress,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    };

    // Try Primary Provider
    if (this.primaryProvider) {
      try {
        await this.repository.incrementAttempt(record.id);
        const res = await this.primaryProvider.sendEmail(emailMsg);
        await this.repository.updateNotificationStatus(record.id, "SENT", undefined, new Date(), res.provider);
        record.status = "SENT";
        record.provider = res.provider;
        return;
      } catch (errPrimary) {
        const errorMsg = errPrimary instanceof Error ? errPrimary.message : String(errPrimary);
        await this.repository.incrementAttempt(record.id, `Primary failed: ${errorMsg}`);

        // Try Fallback Provider
        if (this.fallbackProvider) {
          try {
            const resFallback = await this.fallbackProvider.sendEmail(emailMsg);
            await this.repository.updateNotificationStatus(record.id, "SENT", undefined, new Date(), resFallback.provider);
            record.status = "SENT";
            record.provider = resFallback.provider;
            return;
          } catch (errFallback) {
            const fbError = errFallback instanceof Error ? errFallback.message : String(errFallback);
            await this.repository.updateNotificationStatus(
              record.id,
              "FAILED",
              `Both providers failed. Primary: ${errorMsg}; Fallback: ${fbError}`
            );
            return;
          }
        } else {
          await this.repository.updateNotificationStatus(record.id, "FAILED", `Primary failed: ${errorMsg}`);
          return;
        }
      }
    }

    // If no provider configured (simulation / development)
    await this.repository.updateNotificationStatus(record.id, "SENT", undefined, new Date());
  }

  /**
   * Handle incoming bounce webhook from email provider
   */
  async handleBounceWebhook(address: string, bounceType: "hard" | "soft"): Promise<void> {
    if (bounceType === "hard") {
      await this.repository.addSuppression({
        recipientAddress: address,
        channel: "EMAIL",
        reason: "HARD_BOUNCE",
        suppressedAt: new Date()
      });
    }
  }

  /**
   * Handle spam complaint webhook
   */
  async handleSpamComplaintWebhook(address: string): Promise<void> {
    await this.repository.addSuppression({
      recipientAddress: address,
      channel: "EMAIL",
      reason: "SPAM_COMPLAINT",
      suppressedAt: new Date()
    });
  }
}
