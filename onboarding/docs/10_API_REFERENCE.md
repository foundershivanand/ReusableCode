# 10 — Onboarding API Reference

### `GET /api/onboarding/flows/:flowId`
Returns the flow configuration for a specified flow ID.

### `GET /api/onboarding/flows/:flowId/steps`
Returns filtered, visible steps for the authenticated user context.

### `POST /api/onboarding/steps/complete`
Marks a step as complete, validating proof if server verification is required.
