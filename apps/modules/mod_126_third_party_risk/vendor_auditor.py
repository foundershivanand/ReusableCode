from typing import List, Dict

class ThirdPartyRiskAuditor:
    """Audits third-party SDKs for security risk, privacy compliance, and permission bloat."""

    DANGEROUS_PERMISSIONS = {
        "android.permission.ACCESS_FINE_LOCATION": "HIGH",
        "android.permission.READ_CONTACTS": "HIGH",
        "android.permission.RECORD_AUDIO": "CRITICAL",
        "android.permission.CAMERA": "CRITICAL",
        "android.permission.READ_EXTERNAL_STORAGE": "MEDIUM"
    }

    TRACKER_CATEGORIES = {
        "analytics": 1,
        "advertising": 3,
        "social": 2,
        "crash_reporting": 1
    }

    @classmethod
    def audit_sdk(cls, sdk_name: str, requested_permissions: List[str], category: str) -> dict:
        risk_score = cls.TRACKER_CATEGORIES.get(category.lower(), 2) * 10
        flagged_perms = []

        for p in requested_permissions:
            if p in cls.DANGEROUS_PERMISSIONS:
                severity = cls.DANGEROUS_PERMISSIONS[p]
                flagged_perms.append({"permission": p, "severity": severity})
                risk_score += 25 if severity == "CRITICAL" else 15

        is_high_risk = risk_score >= 40
        return {
            "sdk_name": sdk_name,
            "category": category,
            "risk_score": risk_score,
            "is_high_risk": is_high_risk,
            "flagged_permissions": flagged_perms,
            "recommendation": "Sandbox or replace SDK" if is_high_risk else "Approved with least privilege"
        }
