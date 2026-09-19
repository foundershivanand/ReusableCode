# 01 — Transactional Email & Notification Center Architecture

## 1. System Overview
The Notification module provides a provider-agnostic, multi-channel communication infrastructure for:
- `EMAIL` (Resend, SendGrid, AWS SES)
- `IN_APP` (Real-time bell, drawer, persistent notifications)
- `PUSH` (Mobile and web push notifications)
- `WEBHOOK` (Event webhooks to external integrations)

## 2. Notification State Machine
Unlike simple Boolean `sent = true` implementations, each notification transitions through a defensible financial-grade state machine:
- `QUEUED`: Notification registered, idempotency verified.
- `PROCESSING`: Picked up by worker, template rendered.
- `SENT`: Accepted by provider upstream.
- `DELIVERED`: Confirmed delivered by provider webhook.
- `BOUNCED`: Provider reported hard or soft bounce; recipient added to suppression list.
- `FAILED`: All retries and provider failover exhausted; sent to Dead-Letter Queue (DLQ).
- `COMPLAINED`: Recipient marked email as spam.
- `CANCELED`: Canceled due to user unsubscribe preference or duplicate suppression.

## 3. Provider Failover Architecture
If the primary provider (e.g. Resend) fails with a network or HTTP 5xx error:
1. Attempt is incremented and error logged.
2. The engine immediately switches to the configured fallback provider (e.g. AWS SES / SendGrid).
3. If both providers fail, the job is queued for exponential backoff retry.
4. Maximum attempts default to 3 before moving to DLQ.
