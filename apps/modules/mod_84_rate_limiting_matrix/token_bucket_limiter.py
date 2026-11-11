#!/usr/bin/env python3
import time
from typing import Dict, Tuple

class TokenBucket:
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        self.tokens = float(capacity)
        self.last_refill = time.time()

    def consume(self, tokens: int = 1) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(float(self.capacity), self.tokens + (elapsed * self.refill_rate))
        self.last_refill = now

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False

class ProductionRateLimiter:
    MAX_BUCKETS = 100000

    def __init__(self, max_buckets: int = MAX_BUCKETS):
        self.max_buckets = max_buckets
        self._buckets: Dict[str, TokenBucket] = {}
        self._last_prune = time.time()

    def is_allowed(self, client_key: str, tier: str = "standard", cost: int = 1) -> bool:
        if not client_key:
            return False

        now = time.time()
        # Periodic prune every 60 seconds
        if now - self._last_prune > 60:
            self._prune_stale_buckets(now)
            self._last_prune = now

        bucket = self._buckets.get(client_key)
        if not bucket:
            # Prevent memory exhaustion under DDoS/high cardinality
            if len(self._buckets) >= self.max_buckets:
                self._prune_stale_buckets(now, force=True)
                if len(self._buckets) >= self.max_buckets:
                    return False # Shed load if still saturated

            if tier == "pro":
                bucket = TokenBucket(capacity=100, refill_rate_per_sec=10.0) # 10 req/sec
            else:
                bucket = TokenBucket(capacity=20, refill_rate_per_sec=2.0)   # 2 req/sec
            self._buckets[client_key] = bucket
        return bucket.consume(cost)

    def _prune_stale_buckets(self, now: float, force: bool = False):
        idle_threshold = 60 if force else 300 # 1 min if forced, else 5 mins
        stale_keys = [k for k, b in self._buckets.items() if now - b.last_refill > idle_threshold]
        for k in stale_keys:
            del self._buckets[k]
