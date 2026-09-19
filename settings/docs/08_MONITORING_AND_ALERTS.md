# 08 — Settings Monitoring & Metrics

1. **Key Metrics**:
   - `settings_migrations_total`: Tracks number of v1/v2 to v3 upgrades performed.
   - `settings_validation_failures_total`: Spikes indicate incompatible client frontend versions.
   - `settings_recovery_fallbacks_total`: Indicates corrupted or unparseable database records requiring intervention.
