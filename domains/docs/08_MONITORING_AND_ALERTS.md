# Monitoring & Alerts: Custom Domain & White-Label Engine

## Metrics
- `domains.active_total`: Total active custom domains.
- `domains.verification_duration_seconds`: Time from domain creation to active verification.
- `domains.ssl_expiring_soon_total`: Count of certificates expiring within 14 days.

## Alerts
- `SslExpiringAlert`: Triggered when SSL certificate has less than 7 days remaining and renewal has failed.
- `DomainVerificationFailureSpike`: Triggered when domain verification failure rate exceeds 20%.
