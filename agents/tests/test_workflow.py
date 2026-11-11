"""
Tests for Workflow Execution Engine and DAG Parallel Runner.
"""

import pytest
from agent_factory.core.gateway import LLMGateway, MockProvider
from agent_factory.core.state import AgentStateEnum, ExecutionContext
from agent_factory.orchestration.planner import Plan, PlanStep
from agent_factory.orchestration.workflow import WorkflowEngine
from agent_factory.tools.builtins.search import WebSearchTool
from agent_factory.tools.registry import ToolRegistry


@pytest.mark.asyncio
async def test_workflow_dag_parallel_execution():
    registry = ToolRegistry()
    registry.register(WebSearchTool())

    gateway = LLMGateway(providers={"default": MockProvider()})
    engine = WorkflowEngine(tool_registry=registry, gateway=gateway)

    # Step 1 and Step 2 run in parallel; Step 3 depends on both
    plan = Plan(
        goal="Parallel market research",
        steps=[
            PlanStep(
                step_id="step_1",
                name="Search Competitors",
                description="Find top competitors",
                tool_name="web_search",
                tool_arguments={"query": "top AI competitors"},
                depends_on=[]
            ),
            PlanStep(
                step_id="step_2",
                name="Search Pricing",
                description="Find pricing tiers",
                tool_name="web_search",
                tool_arguments={"query": "AI pricing models"},
                depends_on=[]
            ),
            PlanStep(
                step_id="step_3",
                name="Synthesize Findings",
                description="Merge findings",
                tool_name=None,  # pure reasoning
                tool_arguments={},
                depends_on=["step_1", "step_2"]
            )
        ]
    )

    ctx = ExecutionContext(task_id="t_workflow", agent_id="agent_1", goal=plan.goal)
    completed_ctx = await engine.execute_plan(plan, ctx)

    assert completed_ctx.state == AgentStateEnum.COMPLETED
    assert len(completed_ctx.step_history) == 3
    assert completed_ctx.get_step_output("step_1") is not None
    assert completed_ctx.get_step_output("step_2") is not None
    assert "Completed reasoning step" in completed_ctx.get_step_output("step_3")
