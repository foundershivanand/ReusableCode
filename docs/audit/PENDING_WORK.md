# Complete Pending Work Inventory & Master Checklist

Following the remediation of all P0 and P1 defects, the codebase is in a stable, verified, and test-passing state. This inventory outlines the planned future enhancements, production-hardening tasks, and optimization backlog.

---

## Task Inventory

### Category C & D: Feature Completions & Backlog Enhancements

#### TASK-01: Native Redis Adapter for Bot FSM In Production
- **Task ID**: `TASK-01`
- **Priority**: `P2`
- **Complexity**: `Medium`
- **Affected Files**: `bots/app/engine/fsm.py`, `bots/app/gateway/router.py`
- **Description**: Currently, `ConversationEngine` supports redis clients and has fallback in-memory dicts. When deploying across multiple container instances, Redis clustering and failover handling should be configured with health check ping retries.
- **Why Needed**: Ensures zero state loss when a bot worker restarts during an active multi-turn flow.
- **Dependencies**: Redis 7.x cluster.
- **Acceptance Criteria**: FSM state survives container restart and resumes conversation on an alternate pod.

#### TASK-02: Multi-Region Edge Replication for Turso Storage
- **Task ID**: `TASK-02`
- **Priority**: `P2`
- **Complexity**: `Medium`
- **Affected Files**: `turso-storage/db.ts`, `turso-storage/config.ts`
- **Description**: Configure embedded replica synchronization (`syncUrl` and `authToken`) to allow read replicas in multiple Cloudflare/Vercel edge regions.
- **Why Needed**: Reduces read latency for global code pulls to under 15ms.
- **Dependencies**: Turso Cloud database credentials.
- **Acceptance Criteria**: `turso:sync` command synchronizes edge replicas from primary database without lock contention.

---

### Category E & F: Security & Performance Enhancements

#### TASK-03: Argon2id Password Hashing Upgrade Option
- **Task ID**: `TASK-03`
- **Priority**: `P3`
- **Complexity**: `Small`
- **Affected Files**: `auth/server/password-service.ts`
- **Description**: While bcrypt with cost factor 12 is verified and fully functional, modern OWASP recommendations suggest offering Argon2id as an optional configurable hashing algorithm.
- **Why Needed**: Provides enhanced resistance against ASIC/GPU cracking attacks for high-security enterprise deployments.
- **Dependencies**: None.
- **Acceptance Criteria**: Unit tests verify backward-compatible verification of existing bcrypt hashes while new registrations use Argon2id if enabled.

#### TASK-04: Automated Brotli & Gzip Compression on Ingested File BLOBs
- **Task ID**: `TASK-04`
- **Priority**: `P3`
- **Complexity**: `Small`
- **Affected Files**: `turso-storage/ingest.ts`, `turso-storage/service.ts`
- **Description**: Add automatic compression for stored text files exceeding 10KB.
- **Why Needed**: Reduces SQLite database storage consumption on disk by up to 65%.
- **Dependencies**: None (`node:zlib`).
- **Acceptance Criteria**: Database storage stats show compressed bytes and files are transparently decompressed upon retrieval.

---

### Category H & I: Infrastructure, Deployment & CI/CD

#### TASK-05: GitHub Actions Continuous Integration Workflow
- **Task ID**: `TASK-05`
- **Priority**: `P1`
- **Complexity**: `Small`
- **Affected Files**: `.github/workflows/ci.yml`
- **Description**: Create a unified GitHub Actions matrix workflow running `pnpm test:all` on all pull requests and commits to `main`.
- **Why Needed**: Prevents regressions across TypeScript, Python, and Dart modules from entering the codebase.
- **Dependencies**: GitHub Actions runner.
- **Acceptance Criteria**: All 53 Vitest suites, TypeScript type check, Agent pytest, Bot pytest, and Mobile scale benchmarks execute in CI under 2 minutes.

---

## Master Checklist

- [x] **P0 / CRITICAL**: Resolve Zod 4 issue mapping error in `core/pipeline/pipeline.ts`.
- [x] **P0 / CRITICAL**: Fix hardcoded path in `apps/tests/test_1m_scale_and_security.py`.
- [x] **P0 / CRITICAL**: Create automated pytest suite for Conversational Bots domain (`bots/tests/test_bots_suite.py`).
- [x] **P1 / HIGH**: Resolve 128 TypeScript strict type check errors across 44 files.
- [x] **P1 / HIGH**: Configure `"allowImportingTsExtensions": true` and `"noEmit": true` in `tsconfig.json`.
- [x] **P1 / HIGH**: Implement complete unified test runner script in `package.json` (`pnpm test:all`).
- [x] **P1 / HIGH**: Verify all 318 Web unit tests pass cleanly.
- [x] **P1 / HIGH**: Verify all 23 AI Agent tests pass cleanly via `uv run pytest`.
- [x] **P1 / HIGH**: Verify all 19 Conversational Bot tests pass cleanly via `pytest`.
- [x] **P1 / HIGH**: Verify all 163 Mobile modules pass 1M-scale benchmarks and 14-dimension scorecard.
- [x] **P1 / HIGH**: Implement GitHub Actions automated matrix CI pipeline (`TASK-05` at `.github/workflows/ci.yml`).
- [ ] **P2 / MEDIUM**: Enable Turso multi-region read replicas (`TASK-02`).
- [ ] **P3 / LOW**: Add optional Argon2id password hashing algorithm (`TASK-03`).
- [ ] **P3 / LOW**: Enable transparent Brotli/Gzip compression in file BLOB storage (`TASK-04`).
