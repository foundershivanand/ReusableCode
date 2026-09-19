# 08 — Admin Monitoring & Incident Alarms

1. **Security Alarms**:
   - Critical: Any activation of `BREAK_GLASS_ACTIVATE`.
   - High: More than 3 failed admin login attempts within 5 minutes.
   - High: Execution of `USER_DELETE` or `ORGANIZATION_DELETE`.
2. **Operational Metrics**:
   - `admin_active_sessions`: Gauge of currently logged-in administrators.
   - `admin_impersonations_active`: Active user impersonation sessions.
