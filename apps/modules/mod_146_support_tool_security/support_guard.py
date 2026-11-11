import time
from typing import Dict, List

class SupportToolGuard:
    """Enforces least-privilege, PII masking, and audited access for internal support staff."""

    MASKED_KEYS = {"password_hash", "token", "refresh_token", "stripe_customer_id", "cvv"}

    @classmethod
    def mask_view_for_support(cls, user_profile: dict, agent_role: str) -> dict:
        masked = {}
        for k, v in user_profile.items():
            if k in cls.MASKED_KEYS:
                continue
            if k == "email" and agent_role != "support_supervisor":
                user, domain = v.split("@", 1) if "@" in v else (v, "")
                masked[k] = f"{user[0]}***@{domain}"
            elif k == "phone" and agent_role != "support_supervisor":
                masked[k] = f"***-***-{v[-4:]}" if len(v) >= 4 else "***"
            else:
                masked[k] = v
        return masked

    @staticmethod
    def audit_support_access(agent_id: str, customer_id: str, justification: str) -> dict:
        if not justification or len(justification) < 10:
            raise ValueError("Support access requires a valid customer ticket justification")
        return {
            "agent_id": agent_id,
            "customer_id": customer_id,
            "justification": justification,
            "accessed_at": time.time()
        }
