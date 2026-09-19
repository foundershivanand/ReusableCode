# 02 — Multi-Tenancy Security & Isolation Guarantees

## 1. Threat Model & Protections
- **Insecure Direct Object References (IDOR)**:
  Every resource lookup is parameterized by `organizationId`. Application-level `requireTenantAccess()` asserts that the caller's verified tenant matches the resource's owner.
- **Cross-Tenant Context Poisoning**:
  An attacker attempting to inject a different `organizationId` in query strings or headers while logged in under another tenant is blocked by `TenantResolver`, which validates active membership in the target organization.
- **Privilege Escalation**:
  Role mutations (`updateMemberRole`) are restricted:
  - `ADMIN` cannot promote anyone to `OWNER` or demote an `OWNER`.
  - Only an `OWNER` can transfer ownership or invite another `OWNER`.
- **Last-Owner Protection**:
  The system enforces that an organization must always have at least one active `OWNER`. The sole owner cannot be removed, demoted to Admin/Member, or suspended.
- **Invitation Token Security**:
  Invitation tokens are generated using 32 cryptographically secure random bytes (`crypto.randomBytes(32)`) and stored in the database only as SHA-256 hashes (`tokenHash`). They expire after 7 days and are single-use.
- **Cache Isolation**:
  All cache keys must use the namespaced pattern `tenant:{tenantId}:{resource}:{id}` to avoid cache collisions across tenants.
- **Background Worker Context**:
  Asynchronous tasks must carry immutable `TenantJobContext` objects and must never rely on ambient `currentUser` globals.
