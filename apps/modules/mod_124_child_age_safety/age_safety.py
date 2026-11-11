class ChildAgeSafetyGate:
    MIN_AGE_STANDARD = 13 # COPPA
    MIN_AGE_GDPR_K = 16   # GDPR Article 8

    @classmethod
    def evaluate_user_age(cls, age: int, region: str = "US") -> dict:
        threshold = cls.MIN_AGE_GDPR_K if region.upper() in ["EU", "UK"] else cls.MIN_AGE_STANDARD
        if age < threshold:
            return {
                "permitted": False,
                "requires_parental_consent": True,
                "ad_tracking_allowed": False,
                "data_profiling_allowed": False
            }
        return {
            "permitted": True,
            "requires_parental_consent": False,
            "ad_tracking_allowed": True,
            "data_profiling_allowed": True
        }
