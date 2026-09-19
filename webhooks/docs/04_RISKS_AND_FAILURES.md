# 04 — Webhooks Risks and Failure Modes

## 1. Dead Letter Queues
- Endpoints experiencing 5 consecutive failures transition to `DEAD_LETTER` status to prevent infinite retries.
