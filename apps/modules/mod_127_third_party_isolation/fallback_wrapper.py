#!/usr/bin/env python3
class ThirdPartyFallback:
    @staticmethod
    def execute_with_fallback(primary_fn, fallback_fn):
        try:
            return primary_fn()
        except Exception:
            return fallback_fn()
