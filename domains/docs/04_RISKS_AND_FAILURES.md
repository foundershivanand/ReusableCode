# Risks & Failures: Custom Domain & White-Label Engine

## Failure Modes & Mitigations
1. **SSL Certificate Expiry**: Failure to renew certificates before the 90-day expiry threshold.
   - *Mitigation*: Automated background renewal worker starts attempting renewal at 30 days prior to expiration.
2. **DNS Propagation Delays**: Customer configures DNS, but propagation takes up to 24 hours.
   - *Mitigation*: Asynchronous retry loop with clear user messaging in `<DomainManager />`.
3. **Dangling CNAMEs on Customer Churn**: Customer deletes tenant without removing DNS CNAME at registrar.
   - *Mitigation*: Purge database records, disallow reassignment until re-verified with fresh challenge token.
