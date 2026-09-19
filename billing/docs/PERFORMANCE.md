# Module 02: Performance, Scalability & Caching

## 1. Benchmarking & Scalability Targets

- **Entitlement Checks (`hasFeature()`)**: < 1ms (In-Memory / Redis Cache); < 5ms (PostgreSQL indexed query).
- **Concurrent Entitlement Resolution**: 1,000 evaluations in < 100ms.
- **Webhook Processing Throughput**: > 500 events/second with asynchronous event queues.

---

## 2. Database Indexing Strategy

```sql
-- Fast active subscription lookups by customer
CREATE INDEX idx_billing_sub_customer ON billing_subscriptions (customer_id, status);

-- Fast webhook idempotency checks
CREATE UNIQUE INDEX idx_billing_processed_webhooks_id ON billing_processed_webhooks (provider, event_id);

-- Payment idempotency
CREATE UNIQUE INDEX idx_billing_payments_idempotency ON billing_payments (idempotency_key);

-- Invoice customer history
CREATE INDEX idx_billing_inv_customer ON billing_invoices (customer_id, created_at DESC);
```

---

## 3. High-Volume Scaling (1,000,000 Users)

- **Entitlement Caching**: Cache resolved customer entitlement JSON in Redis (`entitlement:{customerId}`) with a 15-minute TTL.
- **Cache Invalidation**: On incoming subscription webhook events or checkout completion, immediately invalidate the customer's cached entitlement key.
