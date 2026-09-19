import type {
  NotificationRecord,
  NotificationPreferences,
  SuppressionRecord,
  NotificationStatus,
  NotificationChannel
} from "../schemas/index.js";

export interface NotificationRepository {
  createNotification(record: NotificationRecord): Promise<NotificationRecord>;
  getNotificationById(id: string): Promise<NotificationRecord | null>;
  findNotificationByIdempotencyKey(key: string): Promise<NotificationRecord | null>;
  listInAppNotifications(userId: string, limit?: number, unreadOnly?: boolean): Promise<NotificationRecord[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    lastError?: string,
    deliveredAt?: Date,
    provider?: string
  ): Promise<void>;
  incrementAttempt(id: string, error?: string): Promise<number>;

  getPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>;

  isSuppressed(address: string, channel: NotificationChannel): Promise<boolean>;
  addSuppression(suppression: SuppressionRecord): Promise<void>;
  removeSuppression(address: string, channel: NotificationChannel): Promise<void>;
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private notifications: Map<string, NotificationRecord> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private suppressions: Map<string, SuppressionRecord> = new Map(); // key: `${channel}:${address.toLowerCase()}`

  async createNotification(record: NotificationRecord): Promise<NotificationRecord> {
    this.notifications.set(record.id, { ...record });
    return { ...record };
  }

  async getNotificationById(id: string): Promise<NotificationRecord | null> {
    const n = this.notifications.get(id);
    return n ? { ...n } : null;
  }

  async findNotificationByIdempotencyKey(key: string): Promise<NotificationRecord | null> {
    for (const n of this.notifications.values()) {
      if (n.idempotencyKey === key) {
        return { ...n };
      }
    }
    return null;
  }

  async listInAppNotifications(userId: string, limit = 50, unreadOnly = false): Promise<NotificationRecord[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId && n.channel === "IN_APP" && (!unreadOnly || !n.readAt))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((n) => ({ ...n }));
  }

  async markAsRead(id: string): Promise<void> {
    const n = this.notifications.get(id);
    if (n) {
      n.readAt = new Date();
      n.updatedAt = new Date();
      this.notifications.set(id, n);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const now = new Date();
    for (const [id, n] of this.notifications.entries()) {
      if (n.userId === userId && n.channel === "IN_APP" && !n.readAt) {
        n.readAt = now;
        n.updatedAt = now;
        this.notifications.set(id, n);
      }
    }
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    lastError?: string,
    deliveredAt?: Date,
    provider?: string
  ): Promise<void> {
    const n = this.notifications.get(id);
    if (n) {
      n.status = status;
      n.updatedAt = new Date();
      if (lastError !== undefined) n.lastError = lastError;
      if (deliveredAt !== undefined) n.deliveredAt = deliveredAt;
      if (provider !== undefined) n.provider = provider;
      this.notifications.set(id, n);
    }
  }

  async incrementAttempt(id: string, error?: string): Promise<number> {
    const n = this.notifications.get(id);
    if (!n) throw new Error(`Notification ${id} not found`);
    n.attempts += 1;
    n.updatedAt = new Date();
    if (error) n.lastError = error;
    this.notifications.set(id, n);
    return n.attempts;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const existing = this.preferences.get(userId);
    if (existing) return { ...existing };

    const defaults: NotificationPreferences = {
      userId,
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      digestMode: false,
      digestFrequency: "DAILY",
      locale: "en",
      timezone: "UTC"
    };
    this.preferences.set(userId, defaults);
    return defaults;
  }

  async updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferences = {
      ...current,
      ...prefs
    };
    this.preferences.set(userId, updated);
    return { ...updated };
  }

  async isSuppressed(address: string, channel: NotificationChannel): Promise<boolean> {
    const key = `${channel}:${address.toLowerCase()}`;
    return this.suppressions.has(key);
  }

  async addSuppression(suppression: SuppressionRecord): Promise<void> {
    const key = `${suppression.channel}:${suppression.recipientAddress.toLowerCase()}`;
    this.suppressions.set(key, { ...suppression });
  }

  async removeSuppression(address: string, channel: NotificationChannel): Promise<void> {
    const key = `${channel}:${address.toLowerCase()}`;
    this.suppressions.delete(key);
  }
}
