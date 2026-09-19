# 04 — Onboarding Risks and Failure Modes

## 1. Interrupted Sessions & Recovery
- If a user closes the browser or navigates away mid-tour, the `lastResumedAt` timestamp and current step index persist server-side.
- On next session launch, the client checks state and offers to resume right where the user left off.

## 2. Missing DOM Elements
- For tooltip tours targeting dynamic elements, selector timeouts prevent infinite polling or UI freezes when elements fail to render.
