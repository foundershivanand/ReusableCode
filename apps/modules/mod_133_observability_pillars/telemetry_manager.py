import time
import json
from typing import Dict, Optional

class ObservabilityPillarsManager:
    """Correlates the Three Pillars of Observability: Metrics, Structured Logs, and Traces."""

    def __init__(self, service_name: str = "mobile-app-backend"):
        self.service_name = service_name

    def emit_correlated_log(
        self,
        level: str,
        message: str,
        trace_id: str,
        span_id: str,
        user_id: Optional[str] = None,
        extra_fields: Optional[dict] = None
    ) -> str:
        record = {
            "timestamp": time.time(),
            "service": self.service_name,
            "level": level.upper(),
            "message": message,
            "trace_id": trace_id,
            "span_id": span_id,
            "user_id": user_id or "anonymous",
            "context": extra_fields or {}
        }
        return json.dumps(record)

    def record_metric(self, metric_name: str, value: float, labels: Dict[str, str]) -> dict:
        return {
            "metric": metric_name,
            "value": value,
            "labels": labels,
            "timestamp": time.time()
        }
