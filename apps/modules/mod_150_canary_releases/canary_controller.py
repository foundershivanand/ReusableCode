#!/usr/bin/env python3
class CanaryController:
    @staticmethod
    def should_abort_canary(error_rate_pct: float) -> bool:
        return error_rate_pct > 0.5 # 0.5% threshold triggers instant rollback
