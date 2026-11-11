"""
Module 67: Agent Analytics and Operational Metrics
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AgentAnalyticsSnapshot(BaseModel):
    agent_id: str
    tasks_started: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    total_latency_seconds: float = 0.0
    total_tokens_used: int = 0
    total_spend_usd: float = 0.0
    tool_usage_counts: Dict[str, int] = Field(default_factory=dict)

    @property
    def success_rate(self) -> float:
        total = self.tasks_completed + self.tasks_failed
        return (self.tasks_completed / total) if total > 0 else 1.0

    @property
    def average_latency_seconds(self) -> float:
        return (self.total_latency_seconds / self.tasks_completed) if self.tasks_completed > 0 else 0.0


class AgentAnalytics:
    """Module 67: Tracks execution analytics and failure/success distributions."""

    def __init__(self):
        self._agents: Dict[str, AgentAnalyticsSnapshot] = {}

    def get_or_create(self, agent_id: str) -> AgentAnalyticsSnapshot:
        if agent_id not in self._agents:
            self._agents[agent_id] = AgentAnalyticsSnapshot(agent_id=agent_id)
        return self._agents[agent_id]

    def record_task_start(self, agent_id: str) -> None:
        self.get_or_create(agent_id).tasks_started += 1

    def record_task_finish(
        self,
        agent_id: str,
        success: bool,
        duration_seconds: float,
        tokens_used: int,
        spend_usd: float
    ) -> None:
        stats = self.get_or_create(agent_id)
        if success:
            stats.tasks_completed += 1
        else:
            stats.tasks_failed += 1
        stats.total_latency_seconds += duration_seconds
        stats.total_tokens_used += tokens_used
        stats.total_spend_usd += spend_usd

    def record_tool_call(self, agent_id: str, tool_name: str) -> None:
        stats = self.get_or_create(agent_id)
        stats.tool_usage_counts[tool_name] = stats.tool_usage_counts.get(tool_name, 0) + 1
