# Discovered Bugs, Vulnerabilities & Resolved Issues

This document records all bugs, logical errors, type system defects, and security hazards detected during the exhaustive audit, along with the precise remediation applied.

---

## 1. Resolved Defects & Vulnerabilities

### BUG-001: Zod 4 Incompatibility in Universal Request Pipeline (HIGH)
- **File**: `core/pipeline/pipeline.ts` (lines 126, 200)
- **Description**: The pipeline referenced `validationResult.error.errors` and `outValidation.error.errors`.
- **Root Cause**: In Zod 4.x, the standard array of validation failures is accessed via `.issues`, while `.errors` was deprecated and returns `undefined`.
- **Impact**: When schema validation failed, `ValidationError` was initialized with `undefined` issues, dropping diagnostic details from error responses and logs.
- **Resolution**: Updated `error.errors` to `error.issues` for both inbound and outbound validation branches.

### BUG-002: Hardcoded Absolute Path Breaking Mobile Test Suite (HIGH)
- **File**: `apps/tests/test_1m_scale_and_security.py` (line 13)
- **Description**: Hardcoded path `sys.path.insert(0, "/home/shiva/appreusable/modules")` caused test suite to crash with `ModuleNotFoundError: No module named 'mod_66_zero_trust_api'` when executed in any other environment or directory.
- **Root Cause**: Directory was originally developed in a standalone workspace and was hardcoded.
- **Impact**: Any developer or CI/CD runner executing `python3 -m unittest discover -s apps/tests` failed immediately.
- **Resolution**: Refactored to dynamically resolve the path relative to `__file__` with fallback to `APPS_MODULES_DIR` environment variable:
  ```python
  MODULES_DIR = os.environ.get(
      "APPS_MODULES_DIR",
      os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "modules"))
  )
  if MODULES_DIR not in sys.path:
      sys.path.insert(0, MODULES_DIR)
  ```

### BUG-003: Conversational Bots Domain Missing Automated Test Suite (HIGH)
- **Directory**: `bots/`
- **Description**: The `bots` domain had 27 modules implemented but zero automated unit or integration tests existed.
- **Root Cause**: Code was migrated without a corresponding test harness or test runner configuration.
- **Impact**: Regressions in webhook parsing, SSRF filters, loop detectors, and rate limiters could not be detected automatically.
- **Resolution**: Built `bots/tests/test_bots_suite.py` with 19 comprehensive tests covering UNMP schemas, WhatsApp/Telegram/Chatwoot adapters, SSRF IP defense, AI guardrails, admin RBAC authentication, and sliding-window rate limiters. Configured virtualenv and dependencies.

### BUG-004: Zod `z.infer` vs `z.input` Type Mismatch Across 12 Modules (MEDIUM)
- **Files**:
  - `audit/schemas/audit-schemas.ts` (line 84)
  - `changelog/schemas/changelog-schemas.ts` (line 89)
  - `maintenance/schemas/maintenance-schemas.ts` (line 73)
  - `metering/schemas/metering-schemas.ts` (lines 85, 94, 102, 108)
  - `portability/schemas/portability-schemas.ts` (lines 67, 78)
  - `search/schemas/search-schemas.ts` (lines 24, 39, 49)
  - `seo/schemas/seo-schemas.ts` (line 63)
  - `webhooks/schemas/webhook-schemas.ts` (line 39)
- **Description**: Service method parameters typed with `z.infer<typeof Schema>` forced callers to pass properties that had `.default(...)` values defined in Zod schemas.
- **Root Cause**: `z.infer` reflects parsed output types where defaults are filled. The type before parsing is `z.input<typeof Schema>`.
- **Impact**: 128 TypeScript compilation errors occurred across test suites and services when calling methods without passing default arguments.
- **Resolution**: Changed input type exports from `z.infer` to `z.input`, allowing optional omission of defaulted properties while retaining strict typing.

### BUG-005: Unhandled Undefined Invariants in Maintenance and Search Services (MEDIUM)
- **Files**:
  - `maintenance/server/maintenance-service.ts` (lines 64, 66, 109)
  - `search/server/command-registry.ts` (lines 23, 27)
  - `search/server/repository.ts` (lines 51, 57, 82)
- **Description**: Calling `.startsWith()`, `.length`, or `.includes()` on properties that can be undefined prior to schema parsing.
- **Root Cause**: Methods accepted raw input objects without validating that defaults had been applied before querying fields.
- **Impact**: Potential runtime `TypeError: Cannot read properties of undefined` if called with unparsed objects.
- **Resolution**: Added input validation parsing in `checkMaintenance()`, defensive null-coalescing (`(cmd.requiredRoles ?? [])`, `input.limit ?? 20`), and safe array checks.

### BUG-006: Unhandled Return Paths in React Context Hooks (LOW)
- **Files**:
  - `monitoring/client/react-context.tsx` (line 56)
  - `onboarding/components/WelcomeModal.tsx` (line 39)
- **Description**: `useEffect` hooks had conditional branches returning cleanup functions without returning `undefined` on fallback branches, failing TypeScript's `noImplicitReturns` check.
- **Root Cause**: Implicit returns under strict TS configuration.
- **Impact**: TypeScript build failures (`TS7030: Not all code paths return a value`).
- **Resolution**: Added explicit `return undefined;` statements.

### BUG-007: Duplicate SystemBanner Export Collision (LOW)
- **File**: `maintenance/index.ts` (line 5)
- **Description**: `maintenance/index.ts` re-exported `* from "./schemas/index.js"` and `* from "./components/index.js"`. Both exported a symbol named `SystemBanner` (one a TypeScript type, the other a React component).
- **Root Cause**: Namespace collision on wildcard exports under Bundler module resolution.
- **Impact**: TypeScript error `TS2308: Module has already exported a member named 'SystemBanner'`.
- **Resolution**: Explicitly re-exported the React component as `SystemBannerView` in `maintenance/index.ts`.

### BUG-008: Excess Property in Webhook Key Rotation (LOW)
- **File**: `webhooks/server/api-key-service.ts` (line 140)
- **Description**: Method `rotateApiKey` returned `{ apiKey, newApiKey, rawKey }`, but the interface only permitted `{ newApiKey, rawKey }`.
- **Root Cause**: Redundant property `apiKey` left over from refactoring.
- **Impact**: TypeScript error `TS2353: Object literal may only specify known properties`.
- **Resolution**: Removed redundant `apiKey` property from return statement.

---

## 2. Security Findings & Risk Analysis

| ID | Category | Severity | Asset | Threat Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | SSRF Defense | **CRITICAL** | `bots/app/messaging/media.py` | Media downloads could fetch internal RFC 1918 or AWS metadata IP (169.254.169.254). | **VERIFIED & MITIGATED** (DNS + IP filtering verified) |
| **SEC-002** | Prompt Injection | **HIGH** | `bots/app/ai/guardrails.py` | Malicious user input attempting system role override or canary extraction. | **VERIFIED & MITIGATED** (Canaries + Delimiters verified) |
| **SEC-003** | Privilege Escalation | **HIGH** | `apps/modules/mod_67_object_authorization` | BOLA / IDOR attacks accessing other users' records. | **VERIFIED & MITIGATED** (Ownership verification gates verified) |
| **SEC-004** | Secret Scrubbing | **HIGH** | `apps/modules/mod_98_output_security` | Database query or error output leaking credentials, JWT tokens, or API keys. | **VERIFIED & MITIGATED** (Output shaper regex scrubbing verified) |
| **SEC-005** | Distributed Denial of Service | **MEDIUM** | `core/pipeline/`, `apps/modules/mod_84` | Request floods overwhelming authentication and search endpoints. | **VERIFIED & MITIGATED** (Sliding-window rate matrix verified) |
