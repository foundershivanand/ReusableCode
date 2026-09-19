# 03 — Onboarding Performance & Caching

## 1. Flow Definition Caching
- Static onboarding flow definitions are cached in Redis or in-memory LRU with a 1-hour TTL.
- Cache invalidation occurs automatically when an admin publishes a revised flow version.

## 2. Optimistic UI Updates
- Step completion triggers immediate local state updates in the React Context while executing the asynchronous server RPC in the background.
