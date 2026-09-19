# Module 02: Monitoring, Observability & Incident Response Checklist

## 1. Key Metrics & Alert Thresholds

| Metric | Target | Warning Alert | Critical Pager Alert |
|---|---|---|---|
| **Payment Failure Rate** | < 5% | > 10% over 15m | > 25% over 15m (potential card network outage) |
| **Webhook Processing Latency** | < 500ms | > 2s | > 5s |
| **Failed Webhook Processing** | 0 | > 5 failed events | > 20 failed events |
| **Dispute / Chargeback Count** | 0 | > 2 per week | > 5 per week |
| **Reconciliation Drift Count** | 0 | > 1 drift detected | > 10 drifts detected |

---

## 2. Incident Runbooks

- **Webhook Processing Failures**:
  1. Inspect `billing_processed_webhooks` for rows with `status = 'FAILED'`.
  2. Review `failure_reason` column.
  3. Replay failed webhooks from provider dashboard after fixing the underlying bug.
