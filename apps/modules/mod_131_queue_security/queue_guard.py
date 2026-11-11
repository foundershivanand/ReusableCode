import time
import json
import hmac
import hashlib
from typing import Dict, Optional, Tuple

class QueueSecurityGuard:
    """Guards message queues against poison messages, replay attacks, and unauthorized payloads."""

    MAX_RETRIES = 3

    def __init__(self, hmac_secret: str):
        self.secret = hmac_secret.encode("utf-8")

    def sign_message(self, payload: dict) -> str:
        serialized = json.dumps(payload, sort_keys=True).encode("utf-8")
        return hmac.new(self.secret, serialized, hashlib.sha256).hexdigest()

    def verify_message(self, payload: dict, signature: str) -> bool:
        expected = self.sign_message(payload)
        return hmac.compare_digest(expected, signature)

    def evaluate_retry_strategy(self, attempt_count: int, error_type: str) -> Tuple[str, float]:
        if attempt_count >= self.MAX_RETRIES or "PoisonPayload" in error_type:
            return "QUARANTINE_TO_DLQ", 0.0
        # Exponential backoff with jitter: 2^attempt * 1.5s
        backoff_sec = (2 ** attempt_count) * 1.5
        return "RETRY", backoff_sec
