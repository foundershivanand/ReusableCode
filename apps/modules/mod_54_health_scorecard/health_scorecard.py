class AppHealthScorecard:
    @staticmethod
    def evaluate(crash_free_users_pct: float, p99_latency_ms: float, rating: float) -> dict:
        is_healthy = crash_free_users_pct >= 99.5 and p99_latency_ms < 500.0 and rating >= 4.5
        return {
            "crash_free_users_pct": crash_free_users_pct,
            "p99_latency_ms": p99_latency_ms,
            "rating": rating,
            "is_healthy": is_healthy
        }
