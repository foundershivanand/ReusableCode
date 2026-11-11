import time
from typing import Dict

class JobIdempotencyMutex:
    MAX_LOCKS = 100000

    def __init__(self, max_locks: int = MAX_LOCKS):
        self.max_locks = max_locks
        self._locks: Dict[str, float] = {}
        self._last_prune = time.time()

    def acquire_lock(self, job_id: str, lock_ttl_sec: int = 60) -> bool:
        if not job_id:
            return False

        now = time.time()
        # Periodic prune every 60 seconds
        if now - self._last_prune > 60:
            self._prune_expired_locks(now)
            self._last_prune = now

        expiry = self._locks.get(job_id, 0)
        if now < expiry:
            return False # Locked

        if len(self._locks) >= self.max_locks:
            self._prune_expired_locks(now)
            if len(self._locks) >= self.max_locks:
                return False # Capacity saturated

        self._locks[job_id] = now + lock_ttl_sec
        return True

    def release_lock(self, job_id: str):
        self._locks.pop(job_id, None)

    def _prune_expired_locks(self, now: float):
        expired = [k for k, exp in self._locks.items() if now >= exp]
        for k in expired:
            del self._locks[k]
