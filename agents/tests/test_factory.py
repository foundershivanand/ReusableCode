"""
End-to-end tests for Master Agent Factory.
"""

import pytest
from pydantic import BaseModel
from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest
from agent_factory.factory import AgentFactory


class MarketAnalysisOutput(BaseModel):
    summary: str
    key_takeaway: str
    confidence: float


@pytest.mark.asyncio
async def test_factory_build_and_run_agent():
    factory = AgentFactory()

    manifest = AgentManifest(
        identity=AgentIdentity(
            agent_id="test-agent-01",
            agent_name="Test Research Agent",
            description="Agent for test purposes"
        ),
        config=AgentConfig(
            system_prompt="You are a test agent.",
            primary_model="mock-model",
            enabled_tools=["web_search"]
        ),
        capabilities=["web_search"]
    )

    agent = factory.build_agent(manifest)
    assert agent.agent_id == "test-agent-01"

    # Run agent task
    output = await agent.run("Analyze market trends for agent frameworks")
    assert "Completed Task: Analyze market trends" in output

    # Verify observability
    trace_spans = agent.tracer._spans
    assert len(trace_spans) > 0
    assert any("agent_run" in s.name for s in trace_spans)

    # Verify audit log
    audit_records = agent.audit_logger.get_records()
    assert len(audit_records) > 0
    assert audit_records[0].action == "task_started"

    # Verify analytics
    stats = agent.analytics.get_or_create("test-agent-01")
    assert stats.tasks_completed == 1
    assert stats.success_rate == 1.0
