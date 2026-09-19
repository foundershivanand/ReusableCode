# 04 — Multi-Tenancy Risks & Failure Modes

1. **Competing Tenant Source Disagreements**:
   - Risk: User with access to Org A and Org B has an active session for Org A, but opens a link with `orgSlug=b`.
   - Mitigation: `TenantResolver` detects the discrepancy and prompts the user to switch active organizations, rather than silently routing Org A data into Org B.
2. **Accidental Tenant Deletion**:
   - Risk: An admin deletes an organization accidentally, destroying customer data.
   - Mitigation: Deletion requires typing the organization slug and sets status to `PENDING_DELETION` for 30 days before permanent purging.
3. **Orphan Memberships**:
   - Risk: Removing an organization leaves dangling references.
   - Mitigation: Foreign keys with `ON DELETE CASCADE` ensure all workspaces, members, and invitations are cleaned up.
