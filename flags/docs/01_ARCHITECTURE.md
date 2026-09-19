# 01 — Feature Flags & Remote Configuration Architecture

## 1. Overview
The Feature Flags module delivers runtime feature gating, gradual percentage rollouts, multi-attribute targeting, kill switches, and schema-validated remote configuration.

## 2. Evaluation Pipeline & Consistent Hashing
1. **Kill Switch Evaluation**: If `isKillSwitch` is true and flag is disabled, immediate short-circuit with `KILL_SWITCH_ACTIVE`.
2. **Lifecycle & Expiration**: Flags with `EXPIRED` or `DRAFT` state fail closed.
3. **Dependency Graph**: Explicitly evaluates prerequisite flag keys before enabling downstream features.
4. **Targeting Rules**: Matches context attributes (`userId`, `tenantId`, `role`, `plan`, `environment`).
5. **Percentage Rollout**: Deterministic hashing (`SHA-256(key + distinctId) % 100`) ensures variant stickiness across requests.
