class StorePreflightAuditor:
    REQUIREMENTS = [
        "app_icon_1024x1024",
        "privacy_policy_url",
        "terms_of_service_url",
        "support_email",
        "clean_sast_scan",
        "zero_cleartext_http"
    ]

    @classmethod
    def audit_readiness(cls, app_metadata: dict) -> dict:
        missing = [r for r in cls.REQUIREMENTS if not app_metadata.get(r)]
        return {
            "is_release_ready": len(missing) == 0,
            "missing_items": missing
        }
