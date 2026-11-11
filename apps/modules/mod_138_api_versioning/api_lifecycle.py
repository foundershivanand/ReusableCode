#!/usr/bin/env python3
class ApiLifecycle:
    @staticmethod
    def get_deprecation_headers(is_deprecated: bool, sunset_date: str) -> dict:
        if is_deprecated:
            return {"Deprecation": "true", "Sunset": sunset_date}
        return {}
