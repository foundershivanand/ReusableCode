# 08 — Notification Monitoring & Alerts

1. **Key Metrics**:
   - `email_delivery_latency_seconds`: Time between `QUEUED` and `DELIVERED`.
   - `email_bounce_rate`: `(BOUNCED / SENT) * 100`. Alert if > 2%.
   - `email_complaint_rate`: `(COMPLAINED / SENT) * 100`. Alert if > 0.08%.
   - `provider_failover_count`: Triggered when fallback provider is invoked.
2. **Alert Conditions**:
   - High Priority: Bounce rate exceeds 3% over a 1-hour window.
   - Critical: Dead-Letter Queue (DLQ) contains more than 50 failed notifications.
