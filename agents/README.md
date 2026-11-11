# 🤖 AI Agent Product Factory Blueprint (Python)

A reusable, production-grade foundation for building independent, capability-driven AI agents without reinventing gateways, memory, state management, tool sandboxing, human approvals, or evaluation harnesses.

---

## 🏗️ Architecture: 10 Core Layers & 75 Modules

The framework is organized into 10 modular layers:

```text
agentsreusable/
├── agent_factory/
│   ├── core/                  # Layers 1, 2, 8: Identity, Config, Gateway, Reliability, Security
│   │   ├── identity.py        # M01, M02: AgentIdentity, AgentConfig, AgentManifest
│   │   ├── prompt.py          # M03, M04, M05: PromptManager, Templates, Injection Defense
│   │   ├── gateway.py         # M06, M07, M08: LLMGateway, ModelRouter, Fallback
│   │   ├── cost.py            # M09, M10: TokenTracker, CostManager, Pricing & Budgets
│   │   ├── state.py           # M12: AgentState, ExecutionContext, StepResult
│   │   ├── reliability.py     # M47, M48, M49, M50, M60: Retry, Limits, Loops, Idempotency
│   │   └── security.py        # M24, M25, M53, M62: RBAC, Risk Levels, Secret Isolation
│   ├── memory/                # Layer 3: Memory & Context
│   │   ├── working.py         # M13: WorkingMemory (objective, scratchpad, findings)
│   │   ├── conversation.py    # M11: Multi-turn threads & context compaction
│   │   ├── semantic.py        # M14, M15: In-memory vector search & chunking
│   │   ├── episodic.py        # M16: Past experiences & lessons learned
│   │   └── governance.py      # M17, M18: PII redaction, retention, ContextBuilder
│   ├── tools/                 # Layer 4 & 6: Tools & Human-in-the-Loop
│   │   ├── base.py            # BaseTool contract & JSON schema generation
│   │   ├── registry.py        # M22, M23: Central ToolRegistry & execution dispatcher
│   │   ├── approval.py        # M26, M27: HumanApprovalQueue (pause on HIGH/CRITICAL risk)
│   │   └── builtins/          # M28, M29, M30, M31, M51, M52: Search, Browser, Python Sandbox, Files
│   ├── orchestration/         # Layer 5: Orchestration & Workflows
│   │   ├── planner.py         # M19, M20: PlanningEngine & TaskDecomposer
│   │   ├── workflow.py        # M21, M42, M46: Parallel DAG execution engine
│   │   ├── multi_agent.py     # M39, M40, M41: Agent-to-Agent protocol & Supervisor
│   │   └── events.py          # M43, M44, M45: EventBus, TriggerEngine, BackgroundQueue
│   ├── validation/            # M34-M38: Structured Outputs, Verification, Citations
│   │   ├── structured.py      # M34, M35: Pydantic schema enforcement & JSON repair
│   │   ├── verification.py    # M36, M37: Self-verification & Fact-checking
│   │   └── citations.py       # M38: CitationEngine & source provenance
│   ├── observability/         # Layer 10: Tracing, Audit, Metrics
│   │   ├── tracer.py          # M65, M66: Distributed tracing & Span hierarchies
│   │   ├── audit.py           # M64: Tamper-evident security audit logging
│   │   └── metrics.py         # M67: Latency, token usage, and success rate analytics
│   ├── evaluation/            # Layer 9: Quality & Testing
│   │   ├── dataset.py         # M68: GoldenDataset & TestCase models
│   │   ├── judge.py           # M69: LLM-as-Judge rubric scoring (1-5 scale)
│   │   └── regression.py      # M70, M74: Automated benchmark & regression runner
│   └── factory.py             # Master AgentFactory & AgentInstance builder
├── templates/                 # M75: Pre-configured agent products
│   ├── research_agent.py      # Deep Web & Citation Research Agent
│   ├── content_agent.py       # Content Strategy & Generation Agent
│   └── coding_agent.py        # Python Sandbox & Data Analysis Agent
├── cli/                       # Factory CLI
│   └── main.py
└── tests/                     # Comprehensive test suite (14 passing unit & e2e tests)
```

---

## 🚀 Quickstart

### 1. Installation

Using `uv` (recommended):

```bash
uv sync
```

### 2. Factory CLI Commands

List available agent templates:
```bash
uv run python -m cli.main list-templates
```

Run an agent template:
```bash
uv run python -m cli.main run research "Investigate latest developments in autonomous AI agents"
```

Run automated regression benchmarks:
```bash
uv run python -m cli.main eval research
```

---

## 💡 Code Examples

### 1. Assembling an Agent with Capabilities

```python
import asyncio
from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest
from agent_factory.factory import AgentFactory

async def main():
    factory = AgentFactory()

    manifest = AgentManifest(
        identity=AgentIdentity(
            agent_id="finance-agent-01",
            agent_name="Financial Analyst Agent",
            description="Analyzes earnings and computes financial ratios."
        ),
        config=AgentConfig(
            system_prompt="You are a financial analyst. Verify all calculations.",
            primary_model="gpt-4o",
            enabled_tools=["web_search", "python_sandbox"]
        ),
        capabilities=["web_search", "python_sandbox"]
    )

    agent = factory.build_agent(manifest)
    result = await agent.run("Calculate the CAGR of a company from $10M in 2020 to $25M in 2024")
    print(result)

asyncio.run(main())
```

### 2. Creating a Custom Tool with Risk Classification

```python
from pydantic import BaseModel, Field
from agent_factory.tools.base import BaseTool
from agent_factory.core.security import RiskLevel

class EmailInput(BaseModel):
    recipient: str = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject")
    body: str = Field(..., description="Email body content")

class SendEmailTool(BaseTool):
    tool_id = "custom_email"
    name = "send_email"
    description = "Sends an email to a customer."
    risk_level = RiskLevel.HIGH             # Automatically requires approval
    requires_human_approval = True
    input_schema = EmailInput

    async def execute(self, recipient: str, subject: str, body: str):
        # Your email dispatch logic here
        return {"status": "sent", "recipient": recipient}
```

### 3. Enforcing Strict Structured Output

```python
from pydantic import BaseModel

class CompetitorInsight(BaseModel):
    name: str
    strengths: list[str]
    pricing_model: str
    market_share_estimate: float

insight = await agent.run_structured(
    goal="Analyze Stripe's developer positioning",
    output_schema=CompetitorInsight
)
print(insight.model_dump_json(indent=2))
```

### 4. Running the Test Suite

```bash
uv run pytest tests/
```
