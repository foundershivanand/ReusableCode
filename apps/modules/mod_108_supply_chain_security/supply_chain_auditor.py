import hashlib
from typing import Dict

class SupplyChainAuditor:
    @staticmethod
    def verify_lockfile_hash(content: bytes, expected_sha256: str) -> bool:
        computed = hashlib.sha256(content).hexdigest()
        return computed.lower() == expected_sha256.lower()

    @staticmethod
    def audit_package_reputation(package_name: str, weekly_downloads: int, is_deprecated: bool) -> dict:
        is_risky = is_deprecated or weekly_downloads < 100
        return {
            "package": package_name,
            "is_risky": is_risky,
            "reason": "Deprecated or low downloads" if is_risky else "Healthy"
        }
