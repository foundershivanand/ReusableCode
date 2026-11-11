# Module 151: Feature-Gated Migrations

Dual-schema backward compatibility:
- Phase 1: Add new column (nullable)
- Phase 2: Dual-write from new app version
- Phase 3: Backfill old rows
- Phase 4: Make column non-null
