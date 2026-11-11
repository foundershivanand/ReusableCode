from typing import Dict, Set

class PrivacyMinimizationEngine:
    PII_FIELDS: Set[str] = {"email", "phone", "ssn", "full_name", "date_of_birth", "gps_coordinates"}

    @classmethod
    def minimize_data(cls, raw_data: Dict[str, any], purpose: str) -> Dict[str, any]:
        # Purpose-based access: analytics doesn't get raw PII
        if purpose == "analytics":
            return {k: v for k, v in raw_data.items() if k not in cls.PII_FIELDS}
        return raw_data
