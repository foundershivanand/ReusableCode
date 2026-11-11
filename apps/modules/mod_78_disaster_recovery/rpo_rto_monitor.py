import time

class DisasterRecoveryMonitor:
    def __init__(self, target_rpo_minutes: int = 15, target_rto_minutes: int = 60):
        self.target_rpo_sec = target_rpo_minutes * 60
        self.target_rto_sec = target_rto_minutes * 60
        self.last_sync_timestamp = time.time()

    def record_data_sync(self):
        self.last_sync_timestamp = time.time()

    def evaluate_rpo_compliance(self) -> dict:
        drift = time.time() - self.last_sync_timestamp
        compliant = drift <= self.target_rpo_sec
        return {
            "current_rpo_drift_sec": round(drift, 1),
            "target_rpo_sec": self.target_rpo_sec,
            "compliant": compliant
        }
