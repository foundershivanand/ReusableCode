"""
Module 22 & 23: Central Tool Registry and Execution Dispatcher
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional
from pydantic import ValidationError

from agent_factory.core.reliability import IdempotencyManager
from agent_factory.core.security import RiskLevel, ToolPermission
from agent_factory.tools.approval import ApprovalStatus, HumanApprovalQueue
from agent_factory.tools.base import BaseTool, ToolExecutionResult

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Central registry of tools with validation, permissions, idempotency, and approval hooks."""

    def __init__(
        self,
        approval_queue: Optional[HumanApprovalQueue] = None,
        idempotency_manager: Optional[IdempotencyManager] = None
    ):
        self._tools: Dict[str, BaseTool] = {}
        self._permissions: Dict[str, ToolPermission] = {}
        self.approval_queue = approval_queue or HumanApprovalQueue()
        self.idempotency_manager = idempotency_manager or IdempotencyManager()

    def register(self, tool: BaseTool, permission: Optional[ToolPermission] = None) -> None:
        self._tools[tool.name] = tool
        self._permissions[tool.name] = permission or ToolPermission(
            tool_name=tool.name,
            risk_level=tool.risk_level,
            requires_human_approval=tool.requires_human_approval
        )

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def get_openai_tool_definitions(self, filter_tools: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Exports tool schemas formatted for LLM function calling."""
        definitions = []
        for name, tool in self._tools.items():
            if filter_tools is None or name in filter_tools:
                definitions.append(tool.get_json_schema())
        return definitions

    async def execute(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        agent_role: str = "*",
        task_id: str = "default_task",
        agent_id: str = "default_agent",
        approval_id: Optional[str] = None
    ) -> ToolExecutionResult:
        start_time = time.time()
        tool = self._tools.get(tool_name)
        if not tool:
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=f"Tool '{tool_name}' not found in registry.",
                duration_seconds=time.time() - start_time
            )

        perm = self._permissions.get(tool_name)

        # 1. RBAC Permission Check
        if perm and not perm.is_allowed_for(agent_role):
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=f"Permission Denied: Agent role '{agent_role}' not authorized for tool '{tool_name}'.",
                duration_seconds=time.time() - start_time
            )

        # 2. Human Approval Check
        needs_approval = (perm and perm.requires_human_approval) or tool.risk_level == RiskLevel.CRITICAL
        if needs_approval:
            if not approval_id:
                # Submit approval request and pause
                req = self.approval_queue.submit(
                    task_id=task_id,
                    agent_id=agent_id,
                    tool_name=tool_name,
                    arguments=arguments,
                    risk_level=tool.risk_level,
                    reason=f"Execution of {tool.risk_level} risk tool '{tool_name}' requires confirmation."
                )
                return ToolExecutionResult(
                    tool_name=tool_name,
                    success=False,
                    error=f"AWAITING_HUMAN_APPROVAL:{req.request_id}",
                    duration_seconds=time.time() - start_time
                )
            else:
                # Check status of submitted approval
                req = self.approval_queue.get(approval_id)
                if not req or req.status != ApprovalStatus.APPROVED:
                    return ToolExecutionResult(
                        tool_name=tool_name,
                        success=False,
                        error=f"Approval Rejected or Pending for request '{approval_id}'.",
                        duration_seconds=time.time() - start_time
                    )
                if req.modified_arguments:
                    arguments = req.modified_arguments

        # 3. Idempotency Check
        idempotency_key = self.idempotency_manager.compute_key(tool_name, arguments, task_id)
        if self.idempotency_manager.has_executed(idempotency_key):
            cached_result = self.idempotency_manager.get_result(idempotency_key)
            return ToolExecutionResult(
                tool_name=tool_name,
                success=True,
                output=cached_result,
                duration_seconds=time.time() - start_time
            )

        # 4. Schema Validation
        try:
            validated_input = tool.input_schema(**arguments)
        except ValidationError as ve:
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=f"Tool argument validation error: {ve}",
                duration_seconds=time.time() - start_time
            )

        # 5. Execution with Timeout
        try:
            result = await asyncio.wait_for(
                tool.execute(**validated_input.model_dump()),
                timeout=tool.timeout_seconds
            )
            # Record for idempotency
            self.idempotency_manager.record_result(idempotency_key, result)

            return ToolExecutionResult(
                tool_name=tool_name,
                success=True,
                output=result,
                duration_seconds=time.time() - start_time
            )
        except asyncio.TimeoutError:
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=f"Tool execution timed out after {tool.timeout_seconds} seconds.",
                duration_seconds=time.time() - start_time
            )
        except Exception as e:
            logger.error(f"Error running tool '{tool_name}': {e}", exc_info=True)
            return ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                error=str(e),
                duration_seconds=time.time() - start_time
            )
