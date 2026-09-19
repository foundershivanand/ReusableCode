# Risks & Failures: Metering & Credit System

## Potential Failure Modes
1. **Unsettled Reservations**: If a worker crashes before settling or releasing a reservation, credits remain in `reserved_balance`.
   - *Mitigation*: Scheduled cron worker scans expired reservations (`expires_at < NOW()` and `status = 'PENDING'`) and auto-releases them back to `available_balance`.
2. **Concurrent Ingestion Spikes**: High traffic spikes for a single tenant could contend on balance updates.
   - *Mitigation*: In-memory queueing / mutex per tenant, or batched ledger settlement in high-scale configurations.
3. **Payment Decline during Auto-Recharge**:
   - *Mitigation*: Graceful failure handling; billing alert sent to tenant owner without blocking existing positive credit balance.
