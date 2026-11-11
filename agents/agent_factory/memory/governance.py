"""
Module 17 & 18: Memory Governance and Context Builder
"""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.memory.working import WorkingMemory
from agent_factory.memory.semantic import SemanticMemory
from agent_factory.memory.episodic import EpisodicMemory


class MemoryGovernance:
    """Module 17: Enforces retention, privacy scrubbing (PII redaction), and expiration."""

    PII_PATTERNS = {
        "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        "phone": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b"
    }

    @classmethod
    def redact_pii(cls, text: str) -> str:
        """Redacts sensitive PII from memory entries before persisting."""
        redacted = text
        for pii_type, pattern in cls.PII_PATTERNS.items():
            redacted = re.sub(pattern, f"[REDACTED_{pii_type.upper()}]", redacted)
        return redacted


class ContextBuilder:
    """Module 18: Assembles and prioritizes context from memory, working state, and retrieved docs."""

    def __init__(
        self,
        working_memory: Optional[WorkingMemory] = None,
        semantic_memory: Optional[SemanticMemory] = None,
        episodic_memory: Optional[EpisodicMemory] = None
    ):
        self.working_memory = working_memory or WorkingMemory()
        self.semantic_memory = semantic_memory
        self.episodic_memory = episodic_memory

    def build_context(
        self,
        user_request: str,
        retrieved_documents: Optional[List[str]] = None,
        max_context_length: int = 4000
    ) -> str:
        """Constructs an optimized prompt context block."""
        sections: List[str] = [f"### User Request:\n{user_request}"]

        # 1. Working Memory (Active state & findings)
        wm_summary = self.working_memory.summarize_for_context()
        if wm_summary.strip():
            sections.append(f"### Working State:\n{wm_summary}")

        # 2. Semantic Search (Knowledge Base / RAG Chunks)
        if self.semantic_memory:
            results = self.semantic_memory.search(user_request, top_k=2)
            if results:
                doc_lines = [f"- {r['chunk'].text.strip()}" for r in results]
                sections.append("### Relevant Retrieved Knowledge:\n" + "\n".join(doc_lines))

        # 3. Episodic Memory (Lessons learned from past tasks)
        if self.episodic_memory:
            episodes = self.episodic_memory.find_relevant_episodes(user_request, limit=2)
            if episodes:
                sections.append(self.episodic_memory.format_for_prompt(episodes))

        # 4. Explicit Retrieved Documents
        if retrieved_documents:
            sections.append("### Additional Documents:\n" + "\n---\n".join(retrieved_documents))

        full_context = "\n\n".join(sections)
        # Apply governance PII redaction
        sanitized = MemoryGovernance.redact_pii(full_context)
        return sanitized[:max_context_length]
