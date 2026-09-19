# 04 — Notification Risks & Failure Modes

1. **Provider Outage**:
   - Risk: Resend or SendGrid experiences downtime, dropping customer emails.
   - Mitigation: Configurable secondary fallback provider (e.g. AWS SES) with automatic failover and dead-letter retry queue.
2. **Duplicate Email Storms**:
   - Risk: HTTP timeouts or retry storms cause customers to receive dozens of identical emails.
   - Mitigation: Strict `idempotencyKey` check at the database layer; cached deliveries return the original record.
3. **Accidental Unsubscribe from Security Alerts**:
   - Risk: User opts out of emails and misses critical password reset or compromised account notifications.
   - Mitigation: Category isolation ensures `SECURITY` and `LEGAL` emails bypass user unsubscribe flags.
