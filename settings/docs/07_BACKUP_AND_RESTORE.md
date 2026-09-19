# 07 — Settings Backup & Portability

1. **User Settings Export**:
   - `exportSettings(userId)` generates a portable JSON payload containing the current schema version, timestamp, and full settings tree, suitable for GDPR Right to Data Portability requests.
2. **Settings Import**:
   - `importSettings(userId, json)` validates the incoming version and applies automatic schema upgrades prior to persistence.
