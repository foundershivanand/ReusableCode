# 08 — Multi-Tenancy Monitoring & Incident Response

1. **Key Metrics**:
   - `tenancy_conflict_errors_total`: Spikes indicate broken frontend navigation or session desync.
   - `cross_tenant_access_denied_total`: Spikes suggest IDOR vulnerability scanning or misconfigured client calls.
   - `invitations_created_total` & `invitations_accepted_total`: Onboarding conversion tracking.
2. **Security Alerts**:
   - P1: Rapid succession of `CrossTenantAccessError` from a single IP or user.
   - P2: Ownership transfer triggered on high-tier customer organization.
