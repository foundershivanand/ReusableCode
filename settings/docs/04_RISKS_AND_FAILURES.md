# 04 — Settings Risks & Recovery

1. **Schema Desynchronization**:
   - Risk: Old client code submits outdated setting payloads or missing newly required fields.
   - Mitigation: Partial update merging (`updateUserSettings`) ensures existing fields are preserved, and missing required fields default safely.
2. **Preference Corruption**:
   - Risk: Corrupted JSON in the database crashes the frontend.
   - Mitigation: `migrateToV3()` wraps parsing in safe fallbacks, restoring valid defaults if validation fails.
