# 04 — Feature Flags Risks and Failure Modes

## 1. Fail-Closed Default
- If the feature flag service encounters an internal error or external provider failure, all flags marked `failClosed = true` default to disabled.

## 2. Dependency Deadlocks
- Flag dependencies are validated upon creation to prevent circular dependency cycles.
