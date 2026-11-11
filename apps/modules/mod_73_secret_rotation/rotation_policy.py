import time
from typing import Dict, Tuple

class SecretRotationCoordinator:
    def __init__(self, grace_period_sec: int = 86400): # 24h grace period for zero downtime
        self.grace_period_sec = grace_period_sec
        # secret_name -> {"active": val, "previous": val, "rotated_at": ts}
        self._secrets: Dict[str, dict] = {}

    def rotate_secret(self, secret_name: str, new_value: str):
        now = time.time()
        curr = self._secrets.get(secret_name)
        old_val = curr["active"] if curr else None
        self._secrets[secret_name] = {
            "active": new_value,
            "previous": old_val,
            "rotated_at": now
        }

    def is_valid_secret(self, secret_name: str, candidate_value: str) -> bool:
        curr = self._secrets.get(secret_name)
        if not curr:
            return False
        if curr["active"] == candidate_value:
            return True
        # Check previous value if within grace period
        now = time.time()
        if curr["previous"] and (now - curr["rotated_at"]) <= self.grace_period_sec:
            return curr["previous"] == candidate_value
        return False
