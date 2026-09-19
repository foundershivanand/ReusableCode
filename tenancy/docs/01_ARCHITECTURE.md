# 01 — Multi-Tenancy Architecture & Workspace Management

## 1. Overview
The Multi-Tenancy module provides a robust, isolated workspace and team architecture for modern B2B SaaS applications. It operates completely independently of any other module, establishing clear boundaries around organizations, workspaces, and team memberships.

## 2. Multi-Tenancy Models
- **Database Model**: Shared database with tenant discriminator (`organization_id` / `workspace_id`) and Row-Level Security (RLS) enforcement.
- **Context Isolation**: Every query and operation requires a verified `TenantContext`. The client is never trusted to specify a raw `workspace_id` without server authorization.
- **Hierarchical Isolation**:
  - `Organization`: The top-level billing, ownership, and governance boundary.
  - `Workspace`: Sub-teams or project containers nested within an organization.
  - `Member`: A user's explicit role and status within an organization or workspace.

## 3. Tenant Resolution Precedence
When an HTTP request arrives, the `TenantResolver` determines tenant context using a strict precedence chain:
1. **API Key / Service Token**: Machine credentials carry cryptographic tenant claims.
2. **Custom Domain**: Checked against verified custom domains in the database.
3. **Subdomain**: Extracted from the `Host` header (`{slug}.app.domain.com`).
4. **URL Path Slugs**: Extracted from route parameters (`/org/:orgSlug/ws/:wsSlug`).
5. **Explicit Headers**: `X-Tenant-Id`, `X-Organization-Id`, `X-Workspace-Id`.
6. **Session Context**: The active workspace stored in the user's validated session.

### Conflict Detection Rule
If two competing tenant sources are supplied and disagree (e.g. Session indicates Organization A, but `X-Organization-Id` indicates Organization B), the engine immediately throws `TenantConflictError` to prevent silent misdirection.

## 4. Context Poisoning Defense
Before any tenant context is accepted, the server verifies:
1. The organization exists and is in an `ACTIVE` state.
2. The authenticated `userId` is an `ACTIVE` member of that organization.
3. If a specific workspace is requested, the user has access to that workspace.
If validation fails, `TenantAccessForbiddenError` is thrown.
