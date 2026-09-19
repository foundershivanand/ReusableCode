# 01 — Onboarding, Product Tours & Checklists Architecture

## 1. Overview
The Onboarding Module delivers a self-contained, multi-tenant onboarding framework supporting interactive checklists, multi-step product walkthroughs, contextual tooltip tours, and introductory welcome modals.

## 2. Core Entities & State Machine
- **OnboardingFlow**: Defines steps, ordering, version, required permissions/roles, and product key.
- **UserOnboardingState**: Tracks persistent user state across sessions:
  - `NOT_STARTED`: Initial state when user joins.
  - `IN_PROGRESS`: User has begun or resumed the flow.
  - `COMPLETED`: All visible steps marked done and verified.
  - `SKIPPED`: User explicitly bypassed the onboarding sequence.
  - `RESET`: State cleared and re-evaluated from step 0.

## 3. Server-Side Persistence & Versioning
- Progress is never saved solely in browser localStorage; all state transitions are synced to PostgreSQL.
- When an onboarding definition is bumped (e.g. from `v1` to `v2`), existing completed steps are retained while new steps are introduced without resetting user progress.
