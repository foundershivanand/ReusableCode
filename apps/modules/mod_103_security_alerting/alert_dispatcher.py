import time
from typing import List, Dict

class SecurityAlertDispatcher:
    SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def __init__(self):
        self.dispatched_alerts: List[dict] = []
        self._rate_limits: Dict[str, float] = {}

    def dispatch(self, severity: str, title: str, details: dict) -> bool:
        if severity not in self.SEVERITY_LEVELS:
            raise ValueError(f"Invalid severity level: {severity}")
        
        now = time.time()
        # Throttle duplicate alerts within 60 seconds
        dedup_key = f"{severity}:{title}"
        if now - self._rate_limits.get(dedup_key, 0) < 60:
            return False # Throttled
        
        self._rate_limits[dedup_key] = now
        alert = {
            "timestamp": now,
            "severity": severity,
            "title": title,
            "details": details,
            "channels": ["pagerduty", "slack_secops"] if severity in ["HIGH", "CRITICAL"] else ["slack_secops"]
        }
        self.dispatched_alerts.append(alert)
        return True
