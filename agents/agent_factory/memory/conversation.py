"""
Module 11: Conversation Engine
Manages multi-turn conversation threads, message histories, and context compaction.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.gateway import LLMMessage


class ConversationMessage(BaseModel):
    id: str
    role: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_llm_message(self) -> LLMMessage:
        return LLMMessage(role=self.role, content=self.content)


class ConversationThread(BaseModel):
    thread_id: str
    agent_id: str
    user_id: Optional[str] = None
    messages: List[ConversationMessage] = Field(default_factory=list)
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ConversationEngine:
    """Manages persistent conversation threads with automatic compaction."""

    def __init__(self, max_messages_before_compaction: int = 20):
        self.max_messages_before_compaction = max_messages_before_compaction
        self._threads: Dict[str, ConversationThread] = {}

    def get_or_create_thread(self, thread_id: str, agent_id: str, user_id: Optional[str] = None) -> ConversationThread:
        if thread_id not in self._threads:
            self._threads[thread_id] = ConversationThread(thread_id=thread_id, agent_id=agent_id, user_id=user_id)
        return self._threads[thread_id]

    def add_message(self, thread_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> ConversationMessage:
        thread = self.get_or_create_thread(thread_id, agent_id="unknown")
        import uuid
        msg = ConversationMessage(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            metadata=metadata or {}
        )
        thread.messages.append(msg)
        thread.updated_at = datetime.now(timezone.utc)

        # Trigger compaction check
        if len(thread.messages) > self.max_messages_before_compaction:
            self.compact_thread(thread_id)

        return msg

    def compact_thread(self, thread_id: str) -> None:
        """Summarizes older messages while retaining the most recent turns."""
        thread = self._threads.get(thread_id)
        if not thread or len(thread.messages) <= 6:
            return

        # Keep last 6 messages active, summarize the rest
        to_compact = thread.messages[:-6]
        recent = thread.messages[-6:]

        summary_lines = []
        if thread.summary:
            summary_lines.append(f"Previous summary: {thread.summary}")
        for m in to_compact:
            summary_lines.append(f"{m.role.capitalize()}: {m.content[:100]}...")

        thread.summary = "\n".join(summary_lines)
        thread.messages = recent

    def get_llm_messages(self, thread_id: str) -> List[LLMMessage]:
        """Returns message sequence with thread summary injected if present."""
        thread = self._threads.get(thread_id)
        if not thread:
            return []

        out: List[LLMMessage] = []
        if thread.summary:
            out.append(LLMMessage(
                role="system",
                content=f"[Context Summary of earlier conversation]:\n{thread.summary}"
            ))
        out.extend([m.to_llm_message() for m in thread.messages])
        return out
