# Module 10: AI Infrastructure - Schema Design

## Overview
The AI schema is structured to support high-throughput token accounting, audit logging of LLM requests and tool invocations, tenant budget limits with automated kill switches, and resilient asynchronous job processing.

## Tables & Indexes

### 1. `ai_requests`
Stores metadata and token metrics for every completed AI interaction.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(255)` | PRIMARY KEY | Unique request identifier |
| `tenant_id` | `VARCHAR(255)` | NOT NULL | Tenant isolation boundary |
| `user_id` | `VARCHAR(255)` | NOT NULL | Initiating user identifier |
| `feature` | `VARCHAR(100)` | NOT NULL | Feature namespace (e.g., `chat`, `summary`) |
| `provider` | `VARCHAR(50)` | NOT NULL | `OPENAI`, `ANTHROPIC`, `GOOGLE`, `MOCK` |
| `model` | `VARCHAR(100)` | NOT NULL | Model name (e.g., `gpt-4o`, `claude-3-5-sonnet`) |
| `prompt_tokens` | `INT` | NOT NULL | Count of prompt tokens |
| `completion_tokens` | `INT` | NOT NULL | Count of completion tokens |
| `total_tokens` | `INT` | NOT NULL | Total token count |
| `cost_micro_cents` | `BIGINT` | NOT NULL | Estimated cost in micro-cents (1 cent = 10,000) |
| `idempotency_key` | `VARCHAR(255)` | NULL | Optional deduplication key |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Timestamp of request |

**Indexes**:
- `idx_ai_requests_tenant_created`: `(tenant_id, created_at DESC)` for tenant usage queries.
- `idx_ai_requests_idempotency`: `(tenant_id, idempotency_key)` WHERE idempotency_key IS NOT NULL.
- `idx_ai_requests_feature`: `(feature, created_at DESC)` for feature-level cost attribution.

---

### 2. `ai_budgets`
Tracks tenant-level spending limits and the automated emergency kill switch.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `tenant_id` | `VARCHAR(255)` | PRIMARY KEY | Tenant identifier |
| `daily_micro_cents_limit` | `BIGINT` | NOT NULL | Daily spend ceiling in micro-cents |
| `monthly_micro_cents_limit` | `BIGINT` | NOT NULL | Monthly spend ceiling in micro-cents |
| `current_daily_micro_cents` | `BIGINT` | DEFAULT 0 | Accumulated daily spend |
| `current_monthly_micro_cents` | `BIGINT` | DEFAULT 0 | Accumulated monthly spend |
| `kill_switch_active` | `BOOLEAN` | DEFAULT FALSE | Emergency stop switch |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_ai_budgets_kill_switch`: `(kill_switch_active)` for fast status filtering.

---

### 3. `ai_jobs`
BullMQ-style background job queue persistence for long-running workflows.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(255)` | PRIMARY KEY | Unique job ID |
| `name` | `VARCHAR(100)` | NOT NULL | Worker task identifier |
| `tenant_id` | `VARCHAR(255)` | NOT NULL | Tenant identifier |
| `user_id` | `VARCHAR(255)` | NOT NULL | User identifier |
| `payload` | `JSONB` | NOT NULL | Input payload |
| `status` | `VARCHAR(50)` | NOT NULL | `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `DEAD_LETTER`, `CANCELLED` |
| `progress` | `INT` | 0 - 100 | Percentage progress |
| `attempts` | `INT` | >= 0 | Number of attempts taken |
| `max_attempts` | `INT` | >= 1 | Maximum attempts before DLQ |
| `last_error` | `TEXT` | NULL | Last execution error string |
| `result` | `JSONB` | NULL | Output result payload |
| `idempotency_key` | `VARCHAR(255)` | NULL | Prevents duplicate enqueue |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Creation time |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last update time |
| `started_at` | `TIMESTAMPTZ` | NULL | First execution time |
| `completed_at` | `TIMESTAMPTZ` | NULL | Termination time |

**Indexes**:
- `idx_ai_jobs_queue`: `(status, name, created_at ASC)` for high-speed worker polling.
- `idx_ai_jobs_tenant`: `(tenant_id, status, created_at DESC)` for client job listing.
- `idx_ai_jobs_idempotency`: `(tenant_id, idempotency_key)` WHERE idempotency_key IS NOT NULL.

---

### 4. `ai_tool_executions`
Audit ledger for tool/function calling executed by the AI on behalf of users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(255)` | PRIMARY KEY | Log entry ID |
| `tenant_id` | `VARCHAR(255)` | NOT NULL | Tenant identifier |
| `user_id` | `VARCHAR(255)` | NOT NULL | User identifier |
| `tool_name` | `VARCHAR(100)` | NOT NULL | Name of invoked tool |
| `arguments` | `JSONB` | NOT NULL | Arguments passed to tool |
| `authorized` | `BOOLEAN` | NOT NULL | Whether user had required permissions |
| `result` | `JSONB` | NULL | Tool output |
| `error` | `TEXT` | NULL | Execution error if any |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Timestamp |

**Indexes**:
- `idx_ai_tool_executions_tenant`: `(tenant_id, created_at DESC)` for tenant audit trail.
- `idx_ai_tool_executions_tool`: `(tool_name, authorized)` for anomaly and authorization monitoring.
