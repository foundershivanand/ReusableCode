import time
import hmac
import hashlib
from typing import Dict, Optional, Tuple

class SecureCacheWrapper:
    MAX_ENTRIES = 50000

    def __init__(self, key_namespace: str, secret: str = "factory_cache_hmac_secret", max_entries: int = MAX_ENTRIES):
        self.namespace = key_namespace
        self.secret = secret.encode("utf-8")
        self.max_entries = max_entries
        # key -> (timestamp, ttl_sec, value, hmac_signature)
        self._store: Dict[str, Tuple[float, float, str, str]] = {}

    def _format_key(self, raw_key: str) -> str:
        return f"{self.namespace}:{raw_key}"

    def _sign(self, key: str, value: str) -> str:
        return hmac.new(self.secret, f"{key}:{value}".encode("utf-8"), hashlib.sha256).hexdigest()

    def set(self, key: str, value: str, ttl_sec: float = 3600.0):
        if not key or value is None:
            return
        # Eviction if capacity exceeded
        if len(self._store) >= self.max_entries:
            self._evict_expired_or_oldest()

        formatted = self._format_key(key)
        sig = self._sign(formatted, value)
        self._store[formatted] = (time.time(), ttl_sec, value, sig)

    def get(self, key: str) -> Optional[str]:
        if not key:
            return None
        formatted = self._format_key(key)
        entry = self._store.get(formatted)
        if not entry:
            return None

        ts, ttl, val, sig = entry
        # Check expiration
        if time.time() - ts > ttl:
            del self._store[formatted]
            return None

        # Verify integrity
        expected_sig = self._sign(formatted, val)
        if not hmac.compare_digest(expected_sig, sig):
            del self._store[formatted] # Tampered! Evict immediately
            return None

        return val

    def _evict_expired_or_oldest(self):
        now = time.time()
        expired = [k for k, (ts, ttl, _, _) in self._store.items() if now - ts > ttl]
        if expired:
            for k in expired:
                del self._store[k]
        else:
            # Evict oldest 10%
            oldest = sorted(self._store.keys(), key=lambda k: self._store[k][0])[:max(1, len(self._store) // 10)]
            for k in oldest:
                del self._store[k]
