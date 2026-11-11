"""
Tests for Memory Layer: Working, Conversation, Semantic, and Governance.
"""

import pytest
from agent_factory.memory.conversation import ConversationEngine
from agent_factory.memory.episodic import EpisodicMemory
from agent_factory.memory.governance import ContextBuilder, MemoryGovernance
from agent_factory.memory.semantic import SemanticMemory
from agent_factory.memory.working import WorkingMemory


def test_working_memory():
    wm = WorkingMemory(current_objective="Test objective")
    wm.add_finding("Found critical vulnerability in endpoint /api/login")
    wm.set_scratchpad_value("status", "in_progress")

    summary = wm.summarize_for_context()
    assert "Test objective" in summary
    assert "Found critical vulnerability" in summary
    assert wm.get_scratchpad_value("status") == "in_progress"


def test_conversation_engine_compaction():
    engine = ConversationEngine(max_messages_before_compaction=6)
    thread = engine.get_or_create_thread("th_1", "agent_1")

    for i in range(10):
        engine.add_message("th_1", "user" if i % 2 == 0 else "assistant", f"Message {i}")

    # Should have compacted messages exceeding threshold
    assert len(thread.messages) <= 6
    assert thread.summary is not None


def test_semantic_memory_search():
    sm = SemanticMemory()
    sm.chunk_and_index("doc1", "Antigravity is an AI agent framework built by Google DeepMind.", chunk_size=100)
    sm.chunk_and_index("doc2", "The recipe for chocolate cake includes flour, sugar, and cocoa.", chunk_size=100)

    results = sm.search("agent framework", top_k=1)
    assert len(results) == 1
    assert "Antigravity" in results[0]["chunk"].text


def test_memory_governance_pii_redaction():
    raw = "User email is john.doe@example.com and phone is 555-123-4567."
    redacted = MemoryGovernance.redact_pii(raw)
    assert "john.doe@example.com" not in redacted
    assert "[REDACTED_EMAIL]" in redacted
    assert "[REDACTED_PHONE]" in redacted
