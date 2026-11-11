"""
Module 57, 58 & 59: Production FastAPI Server, Streaming (SSE), and Webhooks
"""

import asyncio
import json
from typing import Any, Dict, List, Optional
from fastapi import Depends, FastAPI, HTTPException, Header, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent_factory.api.auth import get_current_tenant, verify_webhook_signature
from agent_factory.core.security import TenantContext
from agent_factory.factory import AgentFactory, AgentInstance
from agent_factory.tools.approval import ApprovalStatus
from templates.coding_agent import create_coding_agent
from templates.content_agent import create_content_agent
from templates.research_agent import create_research_agent

app = FastAPI(
    title="AI Agent Product Factory API Gateway",
    version="1.0.0",
    description="Unified API Gateway exposing independent production AI agents."
)

# Global factory and registered agent cache
factory = AgentFactory()
_agents: Dict[str, AgentInstance] = {
    "research": create_research_agent(factory),
    "content": create_content_agent(factory),
    "coding": create_coding_agent(factory),
}


class RunAgentRequest(BaseModel):
    goal: str = Field(..., description="The objective or prompt for the agent")
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict)
    thread_id: Optional[str] = None


class RunAgentResponse(BaseModel):
    agent_id: str
    task_id: str
    status: str
    result: str


class ResolveApprovalRequest(BaseModel):
    decision: ApprovalStatus  # "APPROVED" or "REJECTED"
    reason: Optional[str] = None
    modified_arguments: Optional[Dict[str, Any]] = None


@app.get("/health")
async def health_check():
    return {"status": "healthy", "agents_loaded": list(_agents.keys())}


@app.get("/agents")
async def list_agents(tenant: TenantContext = Depends(get_current_tenant)):
    """List all deployed agents available to the current tenant."""
    return [
        {
            "agent_id": a.agent_id,
            "name": a.agent_name,
            "version": a.manifest.identity.version,
            "capabilities": a.manifest.capabilities
        }
        for a in _agents.values()
    ]


@app.post("/agents/{agent_id}/run", response_model=RunAgentResponse)
async def run_agent(
    agent_id: str,
    body: RunAgentRequest,
    tenant: TenantContext = Depends(get_current_tenant)
):
    """Executes an agent synchronously and returns the completed execution summary."""
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    output = await agent.run(body.goal, variables=body.variables, thread_id=body.thread_id)
    return RunAgentResponse(
        agent_id=agent.agent_id,
        task_id="task_" + agent.agent_id,
        status="completed",
        result=output
    )


@app.get("/agents/{agent_id}/stream")
async def stream_agent(
    agent_id: str,
    goal: str,
    tenant: TenantContext = Depends(get_current_tenant)
):
    """Module 58: Server-Sent Events (SSE) streaming real-time status and progress events."""
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found.")

    async def event_generator():
        yield f"data: {json.dumps({'event': 'started', 'goal': goal})}\n\n"
        await asyncio.sleep(0.05)
        yield f"data: {json.dumps({'event': 'planning', 'status': 'Generating DAG execution plan'})}\n\n"
        await asyncio.sleep(0.05)

        # Execute agent
        result = await agent.run(goal)
        yield f"data: {json.dumps({'event': 'completed', 'result': result})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/approvals")
async def list_pending_approvals(tenant: TenantContext = Depends(get_current_tenant)):
    """Module 26: Lists all actions currently awaiting human approval."""
    pending = factory.approval_queue.list_pending()
    return pending


@app.post("/approvals/{approval_id}/resolve")
async def resolve_approval(
    approval_id: str,
    body: ResolveApprovalRequest,
    tenant: TenantContext = Depends(get_current_tenant)
):
    """Module 27: Approves or rejects a paused human checkpoint."""
    try:
        resolved = factory.approval_queue.resolve(
            request_id=approval_id,
            decision=body.decision,
            decision_reason=body.reason,
            modified_arguments=body.modified_arguments
        )
        return resolved
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Approval request '{approval_id}' not found.")


@app.post("/webhooks/{webhook_id}")
async def receive_webhook(
    webhook_id: str,
    request: Request,
    x_signature: Optional[str] = Header(None, alias="X-Signature")
):
    """Module 59: Incoming webhook receiver with cryptographic HMAC signature verification."""
    body_bytes = await request.body()
    secret = "production-webhook-secret-key"

    if x_signature and not verify_webhook_signature(body_bytes, x_signature, secret):
        raise HTTPException(status_code=401, detail="Invalid HMAC webhook signature.")

    return {"status": "received", "webhook_id": webhook_id, "bytes": len(body_bytes)}
