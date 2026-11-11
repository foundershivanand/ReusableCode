import json
import time

class SecurityLogger:
    @staticmethod
    def log_event(event_type: str, actor: str, ip: str, outcome: str, details: dict = None) -> str:
        record = {
            "timestamp": time.time(),
            "event_type": event_type,
            "actor": actor,
            "ip": ip,
            "outcome": outcome,
            "details": details or {}
        }
        return json.dumps(record)
