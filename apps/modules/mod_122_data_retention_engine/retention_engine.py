import time
from typing import List, Dict

class DataRetentionEngine:
    RETENTION_POLICIES_DAYS = {
        "security_logs": 90,
        "audit_ledger": 365 * 7, # 7 years
        "temp_sessions": 30,
        "crash_reports": 180
    }

    @classmethod
    def is_expired(cls, data_type: str, created_at_ts: float) -> bool:
        max_days = cls.RETENTION_POLICIES_DAYS.get(data_type, 30)
        max_age_sec = max_days * 86400
        return (time.time() - created_at_ts) > max_age_sec
