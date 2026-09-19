# 03 — Notification Performance & Scaling Strategy

## 1. Asynchronous Offloading
Core application workflows (signup, password reset, checkout) never wait for slow third-party SMTP or HTTP provider calls. The notification record is created synchronously in the database (`QUEUED` or `DELIVERED` for in-app), and downstream delivery is processed asynchronously or by background workers.

## 2. Indexing Strategy
- `idx_notifications_user_channel_read`: Speeds up unread badge queries (`unreadCount`) to < 1ms.
- `idx_notifications_idempotency`: Prevents duplicate records during concurrent retries.
- `idx_suppressions_address_channel`: Instant check against suppression list before sending.

## 3. User Scaling Matrix
- **100 – 1,000 Users**: Immediate in-process asynchronous dispatch.
- **10,000 Users**: BullMQ / Redis queue with worker concurrency of 10–20 workers.
- **1,000,000 Users**: Distributed workers (Trigger.dev / AWS SQS), batching via SendGrid/SES bulk APIs, and daily digest aggregation cron jobs.
