# Risks & Failures: Product Health, Monitoring & Incident System

## Failure Modes & Mitigations
1. **Cascade Failure on Probe Timeout**: If a slow database slows down health probes, load balancers mark all instances dead simultaneously.
   - *Mitigation*: Strict 1500ms timeout per probe; `/live` does not query database.
2. **Alert Fatigue**: Thousands of repetitive notifications during an outage.
   - *Mitigation*: Fingerprint-based deduplication with 5-minute cooldown suppression.
3. **Monitoring System Outage**: If the database fails, the monitoring module itself must degrade gracefully and return partial health reports from memory.
