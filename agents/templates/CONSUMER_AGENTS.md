# PROJECT AGENT INSTRUCTIONS (CONSUMER PROJECT)

## 🌟 Reusable Code Library

This project has access to the central production AI Agent Reusable Library:
- **Repository**: https://github.com/sh15aa/agentreusable
- **Module Registry**: https://raw.githubusercontent.com/sh15aa/agentreusable/main/registry/modules.json
- **Library Package**: `agentsreusable`

---

## 🛑 MANDATORY RULE: REUSE FIRST, BUILD SECOND

Before writing or scaffolding any agent components, gateway integrations, memory systems, tool registries, planning engines, or evaluation scripts:

1. **Query the Registry**:
   Fetch or inspect `https://raw.githubusercontent.com/sh15aa/agentreusable/main/registry/modules.json` (or read `registry/modules.json` if installed locally).
2. **Identify Compatible Modules**:
   Match the required capability against existing modules:
   - Need LLM routing & fallback? Use `agent_factory.core.gateway.LLMGateway`
   - Need token & cost budgets? Use `agent_factory.core.cost.CostManager`
   - Need short-term / scratchpad memory? Use `agent_factory.memory.working.WorkingMemory`
   - Need hybrid RAG (BM25 + Dense)? Use `agent_factory.memory.rag.RAGEngine`
   - Need PII redaction? Use `agent_factory.memory.governance.MemoryGovernance`
   - Need tool registry & execution? Use `agent_factory.tools.registry.ToolRegistry`
   - Need human-in-the-loop approvals? Use `agent_factory.tools.approval.HumanApprovalQueue`
   - Need Python execution sandbox? Use `agent_factory.tools.builtins.code_exec.PythonSandboxTool`
   - Need web search? Use `agent_factory.tools.builtins.search.WebSearchTool`
   - Need web browser? Use `agent_factory.tools.builtins.browser.BrowserTool`
   - Need file parser with traversal defense? Use `agent_factory.tools.builtins.files.FileProcessingTool`
   - Need dynamic planning & DAG execution? Use `agent_factory.orchestration.planner.PlanningEngine` and `agent_factory.orchestration.workflow.WorkflowEngine`
   - Need multi-agent supervisor? Use `agent_factory.orchestration.multi_agent.SupervisorAgent`
   - Need structured outputs with auto-repair? Use `agent_factory.validation.structured.StructuredOutputEngine`
   - Need claim verification & citations? Use `agent_factory.validation.verification.SelfVerificationEngine` and `agent_factory.validation.citations.CitationEngine`
   - Need distributed tracing & audit? Use `agent_factory.observability.tracer.Tracer` and `agent_factory.observability.audit.AuditLogger`
   - Need LLM-as-Judge & benchmarks? Use `agent_factory.evaluation.judge.LLMAsJudge` and `agent_factory.evaluation.regression.RegressionRunner`
   - Need ready-to-run agents? Use `templates.research_agent.create_research_agent`, `templates.coding_agent.create_coding_agent`, `templates.content_agent.create_content_agent`
3. **DO NOT recreate functionality that already exists in `agentsreusable`.**
4. If a needed capability does not exist in the library, implement it cleanly in this project and mark it as a candidate for contribution back to the reusable library.

---

## ⚡ Quick Setup for this Consumer Project

Ensure the library is installed:

```bash
uv add git+https://github.com/sh15aa/agentreusable.git
# or
pip install git+https://github.com/sh15aa/agentreusable.git
```

## 🛠️ Verification Prompt for AI Agents

When instructing your AI agent in this project, use this prompt prefix:

> "Inspect the reusable agent library at https://github.com/sh15aa/agentreusable and its registry at https://raw.githubusercontent.com/sh15aa/agentreusable/main/registry/modules.json.
> Identify all reusable modules that satisfy this application's requirements.
> Import and assemble these modules instead of writing custom boilerplate."
