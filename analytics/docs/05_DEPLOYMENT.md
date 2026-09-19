# 05 — Analytics Deployment & Database Migrations

1. **Database Migration**:
   - Execute `001_initial_analytics_schema.sql` to initialize `analytics_events` and `application_logs` tables.
2. **Provider Key Provisioning**:
   - Provide `POSTHOG_API_KEY`, `MIXPANEL_TOKEN`, or GA4 Measurement Protocol credentials in production environment variables.
