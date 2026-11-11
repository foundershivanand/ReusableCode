import time
from typing import Dict

class ReplayGuard:
    def __init__(self, max_drift_sec: int = 300):
        self.max_drift = max_drift_sec
        self.seen_nonces: Dict[str, float] = {}

    def validate_request(self, nonce: str, timestamp: float) -> bool:
        now = time.time()
        if abs(now - timestamp) > self.max_drift:
            return False # Timestamp drift too high
        if nonce in self.seen_nonces:
            return False # Replay detected
        self.seen_nonces[nonce] = now
        self._prune(now)
        return True

    def _prune(self, now: float):
        expired = [n for n, ts in self.seen_nonces.items() if now - ts > self.max_drift]
        for n in expired:
            del self.seen_nonces[n]
