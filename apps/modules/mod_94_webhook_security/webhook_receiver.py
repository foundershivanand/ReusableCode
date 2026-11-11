import hmac
import hashlib
import time

class WebhookSecurity:
    @staticmethod
    def verify_signature(
        raw_payload: str,
        received_sig: str,
        secret: str,
        timestamp: int,
        tolerance_sec: int = 300
    ) -> bool:
        now = int(time.time())
        if abs(now - timestamp) > tolerance_sec:
            return False
        signing_payload = f"{timestamp}.{raw_payload}".encode("utf-8")
        expected_sig = hmac.new(secret.encode("utf-8"), signing_payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, received_sig)
