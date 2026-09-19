# Environment Variables: Security Center & Compliance Dashboard

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `SECURITY_AUDIT_CRON` | String | No | `0 0 * * *` | Schedule for automated security scans |
| `SECURITY_ALERT_EMAIL` | String | No | - | Notification email for critical security events |
