"""
Tests for Tool Registry, Permissions, Approval, and Built-in Tools.
"""

import pytest
from agent_factory.core.security import RiskLevel, ToolPermission
from agent_factory.tools.approval import ApprovalStatus, HumanApprovalQueue
from agent_factory.tools.builtins.code_exec import PythonSandboxTool
from agent_factory.tools.builtins.search import WebSearchTool
from agent_factory.tools.registry import ToolRegistry


@pytest.mark.asyncio
async def test_web_search_tool():
    search = WebSearchTool()
    res = await search.execute(query="Python 3.12 release notes", max_results=2)
    assert res["query"] == "Python 3.12 release notes"
    assert len(res["results"]) == 2


@pytest.mark.asyncio
async def test_python_sandbox_safety():
    sandbox = PythonSandboxTool()

    # Valid safe code
    safe_code = "result = 10 + 20\nprint(f'Sum: {result}')"
    res = await sandbox.execute(code=safe_code)
    assert res["exit_code"] == 0
    assert "Sum: 30" in res["stdout"]

    # Blocked dangerous code (import os)
    dangerous_code = "import os\nos.system('ls')"
    res_danger = await sandbox.execute(code=dangerous_code)
    assert res_danger["exit_code"] != 0
    assert "Security Alert: Import of module 'os' is prohibited" in res_danger["stderr"]


@pytest.mark.asyncio
async def test_tool_permission_and_human_approval():
    queue = HumanApprovalQueue()
    registry = ToolRegistry(approval_queue=queue)

    tool = WebSearchTool()
    perm = ToolPermission(
        tool_name=tool.name,
        risk_level=RiskLevel.HIGH,
        requires_human_approval=True
    )
    registry.register(tool, permission=perm)

    # First attempt should pause for approval
    res = await registry.execute(
        tool_name="web_search",
        arguments={"query": "test query"},
        task_id="task_1"
    )
    assert not res.success
    assert res.error.startswith("AWAITING_HUMAN_APPROVAL:")

    approval_id = res.error.split(":")[1]
    pending = queue.list_pending()
    assert len(pending) == 1

    # Approve request
    queue.resolve(approval_id, ApprovalStatus.APPROVED)

    # Re-execute with approval_id
    res_approved = await registry.execute(
        tool_name="web_search",
        arguments={"query": "test query"},
        task_id="task_1",
        approval_id=approval_id
    )
    assert res_approved.success
    assert res_approved.output["query"] == "test query"
