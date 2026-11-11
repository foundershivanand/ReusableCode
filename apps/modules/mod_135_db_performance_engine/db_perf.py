class DatabasePerformanceEngine:
    SLOW_QUERY_THRESHOLD_MS = 100.0

    @classmethod
    def evaluate_query(cls, query_sql: str, execution_time_ms: float) -> dict:
        is_slow = execution_time_ms > cls.SLOW_QUERY_THRESHOLD_MS
        missing_index = "where" in query_sql.lower() and "join" in query_sql.lower()
        return {
            "is_slow": is_slow,
            "execution_time_ms": execution_time_ms,
            "index_recommended": missing_index and is_slow
        }
