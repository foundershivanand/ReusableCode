"""
Module 12: Agent Execution State and Context Persistence
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentStateEnum(str, Enum):
    INITIALIZING = "INITIALIZING"
    PLANNING = "PLANNING"
    EXECUTING = "EXECUTING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class StepStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_APPROVAL = "WAITING_APPROVAL"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class StepResult(BaseModel):
    step_id: str
    step_name: str
    status: StepStatus = StepStatus.PENDING
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Optional[Any] = None
    error: Optional[str] = None
    retry_count: int = 0
    duration_seconds: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


class ExecutionContext(BaseModel):
    """Persisted context allowing an interrupted agent to resume exactly where it stopped."""
    task_id: str
    agent_id: str
    state: AgentStateEnum = AgentStateEnum.INITIALIZING
    goal: str
    current_step_id: Optional[str] = None
    step_history: List[StepResult] = Field(default_factory=list)
    variables: Dict[str, Any] = Field(default_factory=dict)
    pending_approval_id: Optional[str] = None
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    def transition_to(self, new_state: AgentStateEnum) -> None:
        self.state = new_state
        self.updated_at = datetime.now(timezone.utc)
        if new_state in (AgentStateEnum.COMPLETED, AgentStateEnum.FAILED, AgentStateEnum.CANCELLED):
            self.completed_at = datetime.now(timezone.utc)

    def record_step(self, step_result: StepResult) -> None:
        # Update if exists, else append
        for i, existing in enumerate(self.step_history):
            if existing.step_id == step_result.step_id:
                self.step_history[i] = step_result
                self.updated_at = datetime.now(timezone.utc)
                return
        self.step_history.append(step_result)
        self.updated_at = datetime.now(timezone.utc)

    def get_step_output(self, step_id: str) -> Optional[Any]:
        for step in self.step_history:
            if step.step_id == step_id and step.status == StepStatus.COMPLETED:
                return step.output_data
        return None
