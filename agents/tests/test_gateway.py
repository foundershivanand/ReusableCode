"""
Tests for LLM Gateway, Routing, Fallback, and Cost Economics.
"""

import pytest
from agent_factory.core.cost import CostManager, TokenUsage
from agent_factory.core.gateway import (
    LLMGateway,
    LLMMessage,
    LLMRequest,
    LLMResponse,
    MockProvider,
    ModelRouter,
    TaskComplexity,
)


@pytest.mark.asyncio
async def test_llm_gateway_basic_execution():
    provider = MockProvider([
        LLMResponse(
            content="Hello from primary model",
            model="gpt-4o",
            usage=TokenUsage(input_tokens=10, output_tokens=15)
        )
    ])
    gateway = LLMGateway(providers={"gpt-4o": provider})

    req = LLMRequest(
        messages=[LLMMessage(role="user", content="Hi")],
        model="gpt-4o"
    )
    resp = await gateway.execute(req, task_id="t1", agent_id="a1")

    assert resp.content == "Hello from primary model"
    assert resp.usage.total_tokens == 25
    assert gateway.cost_manager.get_task_cost("t1") > 0.0


@pytest.mark.asyncio
async def test_llm_gateway_fallback():
    class FailingProvider(MockProvider):
        async def complete(self, request: LLMRequest) -> LLMResponse:
            raise ConnectionError("Primary model timed out")

    failing_provider = FailingProvider()
    backup_provider = MockProvider([
        LLMResponse(content="Hello from backup model", model="gpt-4o-mini")
    ])

    gateway = LLMGateway(providers={
        "gpt-4o": failing_provider,
        "gpt-4o-mini": backup_provider
    })

    req = LLMRequest(
        messages=[LLMMessage(role="user", content="Hi")],
        model="gpt-4o"
    )
    # Should automatically fallback to gpt-4o-mini
    resp = await gateway.execute(req, fallback_models=["gpt-4o-mini"])
    assert resp.content == "Hello from backup model"
    assert resp.model == "gpt-4o-mini"
