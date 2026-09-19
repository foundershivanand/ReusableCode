# 03 — Security Performance & Rate Limit Optimization

## 1. Sliding Window Performance
- In-memory sliding window checks execute in under **0.1ms** per request using sorted integer arrays.
- In distributed environments, rate limits evaluate against Redis via atomic Lua scripts or Redis Sorted Sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`).

## 2. Low-Overhead Normalization
Path parsing and NFKC Unicode normalization run synchronously on incoming request strings without allocating large heap objects.
