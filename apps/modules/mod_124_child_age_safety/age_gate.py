#!/usr/bin/env python3
class AgeGate:
    @staticmethod
    def is_child_user(age: int) -> bool:
        return age < 13

    @staticmethod
    def get_privacy_defaults(age: int) -> dict:
        if age < 13:
            return {"ads_enabled": False, "analytics_tracking": False, "parental_consent_required": True}
        return {"ads_enabled": True, "analytics_tracking": True, "parental_consent_required": False}
