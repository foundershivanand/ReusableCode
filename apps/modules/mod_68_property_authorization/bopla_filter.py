from typing import Dict, List, Set

class BoplaFilter:
    """OWASP API3:2023 Broken Object Property Level Authorization Filter"""
    DEFAULT_BLOCKED_FIELDS: Set[str] = {
        "is_admin", "role", "roles", "permissions", "credits", "balance",
        "verified", "is_verified", "subscription_tier", "internal_id", "password_hash"
    }

    @classmethod
    def filter_payload(
        cls,
        payload: Dict[str, any],
        allowed_fields: Set[str] = None,
        blocked_fields: Set[str] = None
    ) -> Dict[str, any]:
        blocked = (blocked_fields or set()).union(cls.DEFAULT_BLOCKED_FIELDS)
        clean = {}
        for k, v in payload.items():
            if k in blocked:
                continue
            if allowed_fields and k not in allowed_fields:
                continue
            clean[k] = v
        return clean
