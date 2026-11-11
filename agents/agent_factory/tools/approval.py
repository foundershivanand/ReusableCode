"""
Module 26 & 27: Human Approval and Human-in-the-Loop Workflows
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.security import RiskLevel


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"


class ApprovalRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    agent_id: str
    tool_name: str
    arguments: Dict[str, Any]
    risk_level: RiskLevel
    reason: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    decision_reason: Optional[str] = None
    modified_arguments: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None


class HumanApprovalQueue:
    """Queue managing pending and resolved human approval checkpoints."""

    def __init__(self):
        self._requests: Dict[str, ApprovalRequest] = {}

    def submit(
        self,
        task_id: str,
        agent_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        risk_level: RiskLevel,
        reason: str
    ) -> ApprovalRequest:
        req = ApprovalRequest(
            task_id=task_id,
            agent_id=agent_id,
            tool_name=tool_name,
            arguments=arguments,
            risk_level=risk_level,
            reason=reason
        )
        self._requests[req.request_id] = req
        return req

    def get(self, request_id: str) -> Optional[ApprovalRequest]:
        return self._requests.get(request_id)

    def list_pending(self, agent_id: Optional[str] = None) -> List[ApprovalRequest]:
        reqs = [r for r in self._requests.values() if r.status == ApprovalStatus.PENDING]
        if agent_id:
            reqs = [r for r in reqs if r.agent_id == agent_id]
        return reqs

    def resolve(
        self,
        request_id: str,
        decision: ApprovalStatus,
        decision_reason: Optional[str] = None,
        modified_arguments: Optional[Dict[str, Any]] = None
    ) -> ApprovalRequest:
        req = self._requests.get(request_id)
        if not req:
            raise KeyError(f"Approval request '{request_id}' not found.")
        req.status = decision
        req.decision_reason = decision_reason
        req.modified_arguments = modified_arguments
        req.resolved_at = datetime.now(timezone.utc)
        return req
