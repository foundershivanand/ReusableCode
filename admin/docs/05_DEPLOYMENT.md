# 05 — Admin Deployment & Network Controls

1. **Network Layer Isolation**:
   - In production, admin endpoints (`/api/admin/*` and `/admin/*`) should ideally be protected behind a VPN, Tailscale, or Cloudflare Access IP allowlist.
2. **Database Migration**:
   - Apply `001_initial_admin_schema.sql` to initialize admin tables and indexes.
   - Seed an initial super admin account with a secure temporary password and forced MFA on first login.
