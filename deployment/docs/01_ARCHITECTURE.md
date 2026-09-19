# Architecture: Environment & Deployment Management

## Overview
The Deployment module provides typed environment validation, deployment gate verification, config drift detection, zero-downtime expand/contract migration patterns, and secret rotation.

## Core Capabilities
1. **Startup Validation**:
   - Application boots only when all required environment variables pass strict Zod schema validation (e.g. database URL format, cryptographic secret minimum lengths).
2. **Secret Masking & Zero-Leakage**:
   - Secrets are identified by pattern and cryptographically masked (`***`). No secrets are ever returned to client-side bundles or admin UI dashboards.
3. **Dual-Secret Rotation**:
   - Supports active rotation via `APP_SECRET` and `PREVIOUS_APP_SECRET`. Tokens signed with the previous secret remain valid during the rotation transition window without downtime.
4. **Ordered Deployment Gates**:
   - Enforces the deployment sequence: `tests` -> `typecheck` -> `build` -> `migrationCheck` -> `securityCheck` -> `approval`.
5. **Expand/Contract Migration Patterns**:
   - Guarantees backward compatibility between the running application code and new database schema modifications.
