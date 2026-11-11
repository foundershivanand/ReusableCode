#!/usr/bin/env python3
class SiemAnalyzer:
    @staticmethod
    def evaluate_login_spike(failed_logins_last_5min: int) -> bool:
        return failed_logins_last_5min >= 50
