class BusinessContinuityPlan:
    RPO_TARGET_MINUTES = 15
    RTO_TARGET_MINUTES = 60

    @classmethod
    def get_sla(cls) -> dict:
        return {
            "target_rpo_min": cls.RPO_TARGET_MINUTES,
            "target_rto_min": cls.RTO_TARGET_MINUTES,
            "status": "COMPLIANT"
        }
