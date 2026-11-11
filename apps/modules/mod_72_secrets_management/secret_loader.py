import os
import hmac
import hashlib
from typing import Dict, Optional

class HardenedSecretLoader:
    def __init__(self):
        self._memory_secrets: Dict[str, str] = {}

    def set_secret(self, key: str, value: str):
        self._memory_secrets[key] = value

    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        # 1. Check in-memory store
        if key in self._memory_secrets:
            return self._memory_secrets[key]
        # 2. Check environment variable
        val = os.getenv(key)
        if val is not None:
            return val
        return default

    def verify_secret_hash(self, key: str, expected_hash_sha256: str) -> bool:
        secret = self.get_secret(key)
        if not secret:
            return False
        computed = hashlib.sha256(secret.encode()).hexdigest()
        return hmac.compare_digest(computed, expected_hash_sha256)
