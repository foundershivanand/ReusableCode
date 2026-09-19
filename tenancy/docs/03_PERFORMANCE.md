# 03 — Multi-Tenancy Performance & Scaling Strategy

## 1. Indexing Strategy
Compound indexes guarantee sub-millisecond lookups at scale:
- `idx_members_org_user (organization_id, user_id)`: Speeds up membership checks on every request.
- `idx_members_ws_user (workspace_id, user_id)`: Workspace-specific authorization checks.
- `idx_organizations_slug (slug)`: Fast subdomain and path slug resolution.
- `idx_organizations_custom_domain (custom_domain)`: Fast custom host resolution.
- `idx_invitations_token_hash (token_hash)`: Fast verification of invitation tokens.

## 2. Scalability Across User Tiers
- **100 – 1,000 Users**:
  In-memory membership caching and single PostgreSQL instance. All resolution runs in < 2ms.
- **10,000 Users**:
  Redis caching of membership tuples: `tenant:{orgId}:user:{userId}:role` with a 5-minute TTL. Read replicas handle slug and domain queries.
- **1,000,000 Users**:
  Database sharding or Citus-based distributed tables partitioned by `organization_id`. Membership lookups distributed across tenant shards with connection pooling (PgBouncer).
