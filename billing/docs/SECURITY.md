# Module 02: Billing Security & Threat Model

## 1. Threat Mitigations

| Threat Vector | Mitigation Strategy | Verification Test |
|---|---|---|
| **Floating-Point Arithmetic Bugs** | All currency amounts are stored and calculated as exact integer minor units (cents). Zero-decimal currencies (JPY) handled natively. | `money.test.ts` |
| **Tampered Webhook Requests** | HMAC-SHA256 signature verification using provider secrets and timing-safe comparisons (`crypto.timingSafeEqual`). | `webhook.test.ts` |
| **Duplicate / Replayed Webhooks** | Single-use event tracking in `billing_processed_webhooks` using unique event IDs (`(provider, event_id)`). | `webhook.test.ts` |
| **Out-of-Order Webhook Delivery** | Event timestamps and object version reconciliation prevent stale events from overwriting newer state. | `webhook.test.ts` |
| **Double Fulfillment** | Unique idempotency keys on payment records prevent granting credits, access, or downloads twice. | `webhook.test.ts`, `subscription.test.ts` |
| **Billing Portal Session Hijacking** | Portal session URLs are generated strictly server-side, are short-lived (15 minutes), and customer-scoped. | `billing-service.ts` |
| **Price Tampering / Dynamic Invoice Drift** | Invoices store immutable price, tax, and discount snapshots upon creation. Historical invoices are never recalculated. | `tax-and-invoices.test.ts` |
| **Refund Inconsistency** | Full refunds automatically void invoices, transition payment to `REFUNDED`, and revoke active subscriptions. | `refund-consistency.test.ts` |

---

## 2. Webhook Signature Verification

Stripe webhooks are signed using `t=timestamp,v1=signature`. The raw unparsed request body is verified against the shared secret using HMAC-SHA256 to ensure zero tampering by network intermediaries.
