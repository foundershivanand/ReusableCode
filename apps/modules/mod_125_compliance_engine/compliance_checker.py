class ContinuousComplianceEngine:
    STANDARDS = ["SOC2_TYPE2", "ISO27001", "HIPAA", "GDPR"]

    @classmethod
    def evaluate_compliance(cls, controls_state: dict) -> dict:
        missing = []
        for req in ["encryption_at_rest", "encryption_in_transit", "access_reviews", "audit_logging"]:
            if not controls_state.get(req, False):
                missing.append(req)
        return {
            "compliant": len(missing) == 0,
            "missing_controls": missing,
            "standards_evaluated": cls.STANDARDS
        }
