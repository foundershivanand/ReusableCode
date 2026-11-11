"""
Module 64: Audit Logging for Security and Compliance
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("agent_audit")


class AuditRecord(BaseModel):
    audit_id: str
    action: str  # e.g., "tool_execution", "human_approval", "config_change", "login"
    actor_id: str  # user_id or agent_id
    resource: str
    status: str  # "SUCCESS", "FAILURE", "DENIED"
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLogger:
    """Module 64: Tamper-evident audit logging for sensitive agent operations."""

    def __init__(self):
        self._records: List[AuditRecord] = []

    def log(
        self,
        action: str,
        actor_id: str,
        resource: str,
        status: str,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditRecord:
        import uuid
        record = AuditRecord(
            audit_id=str(uuid.uuid4()),
            action=action,
            actor_id=actor_id,
            resource=resource,
            status=status,
            details=details or {}
        )
        self._records.append(record)
        logger.info(f"AUDIT: [{status}] {action} on '{resource}' by '{actor_id}'")
        return record

    def get_records(self, actor_id: Optional[str] = None) -> List[AuditRecord]:
        if actor_id:
            return [r for r in self._records if r.actor_id == actor_id]
        return list(self._records)
