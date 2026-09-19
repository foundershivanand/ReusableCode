# 02 — Feature Flags Security & Authorization Model

## 1. Flags Are Not Authorization
- Feature flags dictate UI presentation and gradual rollout of new features; they MUST NOT replace server-side authorization checks.
- API endpoints protected behind flags must continue validating user session tokens, tenant boundaries, and RBAC permissions.

## 2. Immutable Audit Logging
- Every mutation (create, edit, toggle, rollout change, delete) writes an immutable audit record capturing actor, timestamp, previous state, and new state.
