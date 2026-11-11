import time
import hashlib
from typing import Dict, Optional, Tuple

class IdempotencyGuard:
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Tuple[float, dict]] = {}
        self._last_cleanup = time.time()

    def check_and_set(self, idempotency_key: str, response_payload: dict) -> Tuple[bool, Optional[dict]]:
        now = time.time()
        if now - self._last_cleanup > 300: # Periodic prune every 5 minutes
            self._cleanup(now)
            self._last_cleanup = now

        cached = self._cache.get(idempotency_key)
        if cached:
            ts, resp = cached
            if now - ts <= self.ttl:
                return True, resp
        self._cache[idempotency_key] = (now, response_payload)
        return False, None

    def _cleanup(self, now: float):
        expired = [k for k, (ts, _) in self._cache.items() if now - ts > self.ttl]
        for k in expired:
            del self._cache[k]
