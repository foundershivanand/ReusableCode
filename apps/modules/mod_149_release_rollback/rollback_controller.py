class ReleaseRollbackController:
    ERROR_THRESHOLD_PCT = 1.0

    @classmethod
    def should_rollback(cls, error_rate_pct: float, p99_latency_ms: float) -> dict:
        trigger = False
        reasons = []
        if error_rate_pct > cls.ERROR_THRESHOLD_PCT:
            trigger = True
            reasons.append(f"High error rate: {error_rate_pct}%")
        if p99_latency_ms > 1000.0:
            trigger = True
            reasons.append(f"High p99 latency: {p99_latency_ms}ms")

        return {"rollback": trigger, "reasons": reasons}
