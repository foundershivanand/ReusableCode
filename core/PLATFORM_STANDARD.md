# Universal Platform Architecture & 40-Dimension Resilience Standard

## 1. Universal Architectural Contracts

### A. Universal Request Pipeline
Every API endpoint and action executes through a standardized, non-bypassable sequence:
```
REQUEST
  ↓
Request ID / Trace ID Generation (AsyncLocalStorage propagation)
  ↓
Parse & Schema Validation (Zod input validation)
  ↓
Authentication (Actor verification)
  ↓
Tenant Resolution (Strict tenant boundary validation)
  ↓
Authorization (RBAC / ABAC policy engine)
  ↓
Rate Limiting / Abuse Controls (Sliding window / token bucket)
  ↓
Business Logic (Domain services)
  ↓
Database Transaction (UnitOfWork / Saga coordinator)
  ↓
Output Schema Validation (Fail-closed data leak prevention)
  ↓
Audit & Event Emission
  ↓
Response (Clean user-facing response with trace headers)
```

### B. Universal Error System
- **Error Types**: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `BusinessRuleError`, `ExternalServiceError`, `InternalError`.
- **Principle**: Internal Error $\neq$ User-Facing Error. Internal details (database table names, SQL queries, stack traces, cloud ARNs) are sanitized into structured, user-safe error responses containing only `code`, `message`, `requestId`, and safe `details`.

### C. Universal ID Strategy
- **Sortable Public IDs**: Crockford Base32-encoded time-ordered IDs with domain prefixes (`usr_`, `org_`, `tx_`, `job_`, `key_`, `trace_`).
- **Enumeration Resistance**: 80 bits of cryptographically secure random entropy per ID prevents ID sequence guessing and scraping.
- **Validation**: Strict parsing, timestamp extraction, and prefix verification.

### D. Universal Transaction Strategy
- **Unit of Work**: Atomic transactional consistency across local database operations.
- **Saga Coordinator**: Multi-step distributed transactions with automated reverse-order compensation (e.g. Payment $\rightarrow$ Entitlements $\rightarrow$ Usage Ledger $\rightarrow$ Audit).

### E. Universal Idempotency Framework
- **Idempotency-Key**: Request hashing with SHA-256 (`method + path + body + tenantId`).
- **State Tracking**: `PROCESSING` (lock with timeout), `COMPLETED` (replays stored response), `FAILED` (allows retry).
- **Conflict Detection**: Throws `ConflictError` if an identical key is presented with a mismatched payload.

### F. Universal Authorization Engine
- **Contract**: `authorize({ actor, action, resource, tenant })`.
- **Multi-Tenant Boundary**: Denies cross-tenant operations unless actor possesses system-level privileges.
- **Hybrid RBAC/ABAC**: Supports role-based defaults, wildcard permissions (`billing:*`, `*`), and resource ownership checks.

### G. Universal Secrets Manager Interface
- **Abstraction**: `SecretsManager` interface decoupled from underlying storage (`.env`, Vault, AWS Secrets Manager).
- **Security**: In-memory caching with TTL, single-flight refresh, and automated masking/redaction for sensitive keys.

### H. Universal Encryption & Key Management
- **Application-Level Encryption**: Authenticated AES-256-GCM with 96-bit IV and 128-bit authentication tag.
- **Key Versioning & Rotation**: Version-tagged ciphertexts (`enc:v1:...`) and seamless rotation (`reEncryptField`) when active key version increments.

### I. Universal Data Lifecycle
- **Ownership & Tenant Isolation**: Every entity tracks `ownerId` and `tenantId`.
- **Soft & Hard Deletion**: Soft delete with actor auditing, cascade policies (`CASCADE_DELETE`, `ANONYMIZE`, `TRANSFER_OWNERSHIP`, `RETAIN`).
- **Data Portability**: Clean export bundle generation for GDPR/CCPA compliance.

### J. Universal Background-Job Contract
- **Job Contract**: `jobId`, `tenantId`, `actorId`, `requestId`, `attempt`, `status`, `retryPolicy`, `timeoutMs`, `idempotencyKey`.
- **Resilience**: Exponential backoff with jitter, automatic timeout termination, and deduplication.

### K. Universal Observability Contract
- **Trace Propagation**: Trace and span IDs injected into `AsyncLocalStorage` and propagated through API, services, database queries, and background queues.
- **Structured Logging**: JSON logging with automatic trace correlation and PII/secret scrubbing.

### L. Universal Caching Rules
- **Key Schema**: `namespace:tenantId:resource:identifier`.
- **Isolation**: Tenant isolation enforced at key generation and read time.
- **Stampede Protection**: In-flight single-flight mutexes prevent cache stampedes on expensive origin queries.

---

## 2. The 40-Dimension Resilience & Threat Analysis Matrix

When building and evaluating features across all modules, every feature is assessed against the 40 dimensions proportionally based on threat/risk:

| # | Dimension | Core Platform Control |
| :--- | :--- | :--- |
| 1 | **Functional Requirements** | Typed domain services, contract-first interfaces |
| 2 | **Server-Side Validation** | Zod runtime input validation on all entry points |
| 3 | **Authentication** | Unified actor identity verification and session validation |
| 4 | **Authorization** | Centralized `authorize({ actor, action, resource, tenant })` |
| 5 | **Tenant Isolation** | Strict tenant ID comparison and segregated cache/database scopes |
| 6 | **Input Sanitization** | Strict schema stripping, type coercion prevention, length limits |
| 7 | **Output Validation** | Fail-closed output schema check preventing internal data leaks |
| 8 | **State Transitions** | Formal state machines for finding/job/order lifecycles |
| 9 | **Concurrency** | Single-flight cache mutexes, atomic ledger operations |
| 10 | **Race Conditions** | Optimistic locking, transactional balance decrements |
| 11 | **Idempotency** | Centralized `IdempotencyManager` with request hashing |
| 12 | **Retries** | Exponential backoff with jitter and retry count bounds |
| 13 | **Duplicate Requests** | In-flight request locking and replay of completed responses |
| 14 | **Partial Failures** | Saga compensation rollback across multi-step operations |
| 15 | **External Outages** | Circuit breakers, timeouts, fallback degradation |
| 16 | **Data Consistency** | Unit of Work transactional boundaries |
| 17 | **Database Constraints** | Foreign keys, unique constraints, non-null guarantees |
| 18 | **Transactions** | Explicit transaction context propagation |
| 19 | **Caching** | Tenant-isolated keys, TTL, tag invalidation, stampede prevention |
| 20 | **Background Jobs** | Standardized job definition with timeout and retry contracts |
| 21 | **Rate Limiting** | Sliding window / token bucket per IP, user, and tenant |
| 22 | **Abuse Prevention** | Correlation engines for anomalous spikes and brute-force |
| 23 | **Privacy** | Automated PII and secret redaction in logging and tracing |
| 24 | **Auditability** | Tamper-evident audit logs with trace correlation IDs |
| 25 | **Observability** | Context-propagated distributed tracing and structured logs |
| 26 | **Data Retention** | Expiration dates and automated retention pruning |
| 27 | **Deletion** | Soft deletion with audit trail and owner cascade policies |
| 28 | **Backup / Recovery** | Point-in-time recovery metadata and export bundles |
| 29 | **Migration Compatibility** | Non-destructive schema evolution, checksum validation |
| 30 | **Accessibility** | ARIA labels, semantic markup, keyboard navigation |
| 31 | **Performance** | Query index locality with sortable IDs, cached secrets |
| 32 | **Scalability** | Stateless application tier, partitioned caching |
| 33 | **Testing** | Unit, integration, concurrency, and failure simulation tests |
| 34 | **Deployment** | Semantic versioning, commit SHA tracking, rollback readiness |
| 35 | **Rollback** | Automated migration rollbacks and deployment verification |
| 36 | **Dependency Security** | Automated scans for outdated or vulnerable packages |
| 37 | **Secrets Management** | Abstracted `SecretsManager` interface, zero plain-text secrets |
| 38 | **Disaster Recovery** | Regional failover readiness and database snapshot audits |
| 39 | **Documentation** | Standardized 10-guide architecture and operational docs |
| 40 | **Operational Runbooks** | Step-by-step incident response and troubleshooting guides |
