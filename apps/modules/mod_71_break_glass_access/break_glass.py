import time
import secrets
from typing import Dict, Optional

class BreakGlassManager:
    """Dual-custody emergency access with time-boxed authorization and audit ledger"""
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = ttl_seconds
        self.active_sessions: Dict[str, dict] = {}

    def request_emergency_access(
        self,
        requester_id: str,
        approver_id: str,
        incident_id: str,
        justification: str
    ) -> Optional[str]:
        # Dual custody: Requester cannot approve their own break-glass request
        if requester_id == approver_id:
            raise ValueError("Break-glass access requires dual custody: approver must differ from requester")

        token = f"bg_{secrets.token_hex(24)}"
        now = time.time()
        self.active_sessions[token] = {
            "requester_id": requester_id,
            "approver_id": approver_id,
            "incident_id": incident_id,
            "justification": justification,
            "created_at": now,
            "expires_at": now + self.ttl,
            "revoked": False
        }
        return token

    def validate_access(self, token: str) -> bool:
        sess = self.active_sessions.get(token)
        if not sess or sess["revoked"]:
            return False
        return time.time() < sess["expires_at"]

    def revoke_access(self, token: str):
        if token in self.active_sessions:
            self.active_sessions[token]["revoked"] = True
