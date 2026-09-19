# Risks & Failures: Changelog, Roadmap & What's New

## Potential Failure Modes
1. **Accidental Publication of Unreleased Features**:
   - *Mitigation*: Multi-stage workflow (`DRAFT` -> `REVIEW` -> `PUBLISHED`) requiring explicit publisher permissions.
2. **Notification Fatigue**:
   - *Mitigation*: What's New modal only presents unread items, and users can dismiss individual updates or all at once.
3. **Broken Assets or External Links**:
   - *Mitigation*: Automated link syntax validation runs before transition to `PUBLISHED` status.
