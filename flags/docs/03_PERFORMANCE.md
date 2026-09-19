# 03 — Feature Flags Performance & Caching

## 1. In-Memory Evaluation
- Flag rules are evaluated purely in-memory (< 1ms latency per evaluation).
- Flag definitions are pre-cached in memory or Redis with a configurable TTL (e.g., 60 seconds) with pub/sub invalidation.
