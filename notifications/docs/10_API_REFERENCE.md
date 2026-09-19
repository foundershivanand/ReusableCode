# 10 — Notification API Reference

## 1. NotificationService Methods
- `sendNotification(payload: NotificationPayload): Promise<NotificationRecord>`
- `handleBounceWebhook(address: string, bounceType: "hard" | "soft"): Promise<void>`
- `handleSpamComplaintWebhook(address: string): Promise<void>`

## 2. NotificationRepository Methods
- `createNotification(record: NotificationRecord): Promise<NotificationRecord>`
- `getNotificationById(id: string): Promise<NotificationRecord | null>`
- `findNotificationByIdempotencyKey(key: string): Promise<NotificationRecord | null>`
- `listInAppNotifications(userId: string, limit?: number, unreadOnly?: boolean): Promise<NotificationRecord[]>`
- `markAsRead(id: string): Promise<void>`
- `markAllAsRead(userId: string): Promise<void>`
- `updateNotificationStatus(id: string, status: NotificationStatus, lastError?: string, deliveredAt?: Date): Promise<void>`
- `getPreferences(userId: string): Promise<NotificationPreferences>`
- `updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>`
- `isSuppressed(address: string, channel: NotificationChannel): Promise<boolean>`
- `addSuppression(suppression: SuppressionRecord): Promise<void>`

## 3. Client & Hooks
- `useNotifications()`: `{ notifications, unreadCount, loading, error, refreshNotifications, markAsRead, markAllAsRead }`
- `useNotificationPreferences()`: `{ preferences, loading, error, updatePreferences }`
