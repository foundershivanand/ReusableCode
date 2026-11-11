import time
import uuid
from typing import Dict, Optional

class IncidentLifecycleManager:
    INCIDENT_STATUS = ["TRIGGERED", "ACKNOWLEDGED", "INVESTIGATING", "CONTAINED", "RESOLVED"]

    def __init__(self):
        self.incidents: Dict[str, dict] = {}

    def declare_incident(self, severity: str, summary: str, lead_responder: str) -> str:
        inc_id = f"inc_{uuid.uuid4().hex[:8]}"
        self.incidents[inc_id] = {
            "incident_id": inc_id,
            "severity": severity,
            "summary": summary,
            "lead": lead_responder,
            "status": "TRIGGERED",
            "created_at": time.time(),
            "updated_at": time.time(),
            "timeline": [{"ts": time.time(), "note": "Incident declared"}]
        }
        return inc_id

    def update_status(self, incident_id: str, new_status: str, note: str = ""):
        if incident_id not in self.incidents or new_status not in self.INCIDENT_STATUS:
            return False
        inc = self.incidents[incident_id]
        inc["status"] = new_status
        inc["updated_at"] = time.time()
        inc["timeline"].append({"ts": time.time(), "status": new_status, "note": note})
        return True
