# 10 — Feature Flags API Reference

### `POST /api/flags/evaluate`
Evaluates a flag key against provided context.

### `POST /api/flags/:key/toggle`
Toggles a feature flag on or off. Requires ADMIN permission.

### `POST /api/flags/:key/rollout`
Updates percentage rollout for a flag.
