"""
Module 39, 40 & 41: Multi-Agent Orchestration, Inter-Agent Communication, and Supervisor
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.gateway import LLMGateway, LLMMessage, LLMRequest


class AgentMessageType(str, Enum):
    DELEGATE_TASK = "DELEGATE_TASK"
    TASK_RESULT = "TASK_RESULT"
    QUERY = "QUERY"
    RESPONSE = "RESPONSE"
    STATUS_UPDATE = "STATUS_UPDATE"


class AgentMessage(BaseModel):
    """Module 40: Standard inter-agent communication protocol."""
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    task_id: str
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message_type: AgentMessageType
    payload: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MultiAgentOrchestrator:
    """Module 39: Coordinates communication and state between multiple specialized agents."""

    def __init__(self):
        self._message_bus: List[AgentMessage] = []
        self._subscribers: Dict[str, Any] = {}

    def register_agent(self, agent_id: str, agent_instance: Any) -> None:
        self._subscribers[agent_id] = agent_instance

    async def send_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        self._message_bus.append(message)
        receiver = self._subscribers.get(message.receiver_id)
        if receiver and hasattr(receiver, "handle_agent_message"):
            return await receiver.handle_agent_message(message)
        return None

    def get_task_trace(self, task_id: str) -> List[AgentMessage]:
        return [m for m in self._message_bus if m.task_id == task_id]


class SupervisorAgent:
    """Module 41: Controls subordinate agents, assigns tasks, and synthesizes outputs."""

    def __init__(self, supervisor_id: str, gateway: LLMGateway, orchestrator: MultiAgentOrchestrator):
        self.supervisor_id = supervisor_id
        self.gateway = gateway
        self.orchestrator = orchestrator
        self.orchestrator.register_agent(supervisor_id, self)

    async def delegate(self, subordinate_id: str, task_id: str, subtask_goal: str) -> Dict[str, Any]:
        msg = AgentMessage(
            sender_id=self.supervisor_id,
            receiver_id=subordinate_id,
            task_id=task_id,
            message_type=AgentMessageType.DELEGATE_TASK,
            payload={"goal": subtask_goal}
        )
        response_msg = await self.orchestrator.send_message(msg)
        return response_msg.payload if response_msg else {"status": "dispatched"}

    async def synthesize_results(self, overall_goal: str, subordinate_results: Dict[str, Any]) -> str:
        """Module 41: Merges results from multiple agents into a unified deliverable."""
        system_prompt = (
            "You are a Supervisor Agent. Synthesize the findings and results from your subordinate "
            "agents into a comprehensive, coherent final answer to the overall goal."
        )
        user_prompt = (
            f"Overall Goal: {overall_goal}\n\n"
            f"Subordinate Results:\n{subordinate_results}"
        )
        req = LLMRequest(
            messages=[
                LLMMessage(role="system", content=system_prompt),
                LLMMessage(role="user", content=user_prompt)
            ],
            model="gpt-4o",
            temperature=0.2
        )
        resp = await self.gateway.execute(req)
        return resp.content or "No synthesis generated."
