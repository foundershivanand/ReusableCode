"""
Module 21, 42 & 46: Workflow Execution Engine and DAG Orchestrator
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Set

from agent_factory.core.gateway import LLMGateway
from agent_factory.core.reliability import LoopDetector, ResourceLimits
from agent_factory.core.state import AgentStateEnum, ExecutionContext, StepResult, StepStatus
from agent_factory.orchestration.planner import Plan, PlanStep
from agent_factory.tools.registry import ToolRegistry

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Executes DAG plans, coordinates parallel steps, handles approvals, and tracks execution state."""

    def __init__(
        self,
        tool_registry: ToolRegistry,
        gateway: LLMGateway,
        resource_limits: Optional[ResourceLimits] = None
    ):
        self.tool_registry = tool_registry
        self.gateway = gateway
        self.resource_limits = resource_limits or ResourceLimits()
        self.loop_detector = LoopDetector()

    async def execute_plan(
        self,
        plan: Plan,
        context: ExecutionContext,
        agent_role: str = "*",
        resume_approval_id: Optional[str] = None
    ) -> ExecutionContext:
        """Executes a plan respecting dependencies, parallelizing ready steps, and persisting state."""
        context.transition_to(AgentStateEnum.EXECUTING)
        completed_step_ids: Set[str] = {
            s.step_id for s in context.step_history if s.status == StepStatus.COMPLETED
        }
        steps_by_id: Dict[str, PlanStep] = {s.step_id: s for s in plan.steps}

        start_time = time.time()
        iteration = 0

        while len(completed_step_ids) < len(plan.steps):
            iteration += 1
            if iteration > self.resource_limits.max_steps:
                context.error = f"Resource limit exceeded: max_steps ({self.resource_limits.max_steps}) reached."
                context.transition_to(AgentStateEnum.FAILED)
                return context

            if (time.time() - start_time) > self.resource_limits.max_execution_time_seconds:
                context.error = f"Execution timed out after {self.resource_limits.max_execution_time_seconds}s."
                context.transition_to(AgentStateEnum.FAILED)
                return context

            # Identify all steps whose dependencies are satisfied and have not completed
            ready_steps = [
                step for step in plan.steps
                if step.step_id not in completed_step_ids
                and all(dep in completed_step_ids for dep in step.depends_on)
            ]

            if not ready_steps:
                # Deadlock or cyclic dependency in plan
                context.error = "Workflow stalled: unable to resolve remaining step dependencies."
                context.transition_to(AgentStateEnum.FAILED)
                return context

            # Execute ready steps in parallel
            async def _run_single_step(step: PlanStep) -> StepResult:
                step_start = time.time()
                context.current_step_id = step.step_id

                # 1. Loop detection check
                if self.loop_detector.record_and_check(step.tool_name or "reasoning", step.tool_arguments):
                    return StepResult(
                        step_id=step.step_id,
                        step_name=step.name,
                        status=StepStatus.FAILED,
                        error="LoopDetector: Detected repeating cyclic execution."
                    )

                # 2. Tool Execution (if tool specified)
                if step.tool_name:
                    # Dynamically inject previous step outputs into arguments if referenced like {{step_1.output}}
                    resolved_args = {}
                    for k, v in step.tool_arguments.items():
                        if isinstance(v, str) and v.startswith("{{") and v.endswith(".output}}"):
                            ref_step = v.strip("{}").split(".")[0]
                            resolved_args[k] = context.get_step_output(ref_step) or v
                        else:
                            resolved_args[k] = v

                    tool_res = await self.tool_registry.execute(
                        tool_name=step.tool_name,
                        arguments=resolved_args,
                        agent_role=agent_role,
                        task_id=context.task_id,
                        agent_id=context.agent_id,
                        approval_id=resume_approval_id
                    )

                    if not tool_res.success and tool_res.error and tool_res.error.startswith("AWAITING_HUMAN_APPROVAL:"):
                        approval_req_id = tool_res.error.split(":")[1]
                        return StepResult(
                            step_id=step.step_id,
                            step_name=step.name,
                            status=StepStatus.WAITING_APPROVAL,
                            error=f"Awaiting human approval (Request ID: {approval_req_id})"
                        )

                    return StepResult(
                        step_id=step.step_id,
                        step_name=step.name,
                        status=StepStatus.COMPLETED if tool_res.success else StepStatus.FAILED,
                        input_data=resolved_args,
                        output_data=tool_res.output,
                        error=tool_res.error,
                        duration_seconds=time.time() - step_start
                    )

                # Pure reasoning step
                return StepResult(
                    step_id=step.step_id,
                    step_name=step.name,
                    status=StepStatus.COMPLETED,
                    output_data=f"Completed reasoning step: {step.description}",
                    duration_seconds=time.time() - step_start
                )

            # Parallel step execution (Module 46)
            results = await asyncio.gather(*[_run_single_step(s) for s in ready_steps])

            # Process results
            has_approval_wait = False
            for res in results:
                context.record_step(res)
                if res.status == StepStatus.COMPLETED:
                    completed_step_ids.add(res.step_id)
                elif res.status == StepStatus.WAITING_APPROVAL:
                    has_approval_wait = True
                    context.pending_approval_id = res.error
                elif res.status == StepStatus.FAILED:
                    context.error = f"Step '{res.step_name}' failed: {res.error}"
                    context.transition_to(AgentStateEnum.FAILED)
                    return context

            if has_approval_wait:
                context.transition_to(AgentStateEnum.WAITING_FOR_APPROVAL)
                return context

        context.transition_to(AgentStateEnum.COMPLETED)
        return context
