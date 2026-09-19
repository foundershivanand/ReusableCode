# 04 — Audit Logs Risks and Failure Modes

## 1. Audit Failure Handling
- Audit log operations must be resilient. If the primary application transaction commits, the audit log must be guaranteed to write or buffered in dead-letter queues.
- Tamper attempts are flagged by the periodic integrity verification job.
