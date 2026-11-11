"""
The Master AI Agent Factory: Assembles independent production agents from reusable modules.
"""

import time
import uuid
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

from agent_factory.core.cost import CostManager
from agent_factory.core.gateway import LLMGateway, LLMMessage, LLMRequest, MockProvider
from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest
from agent_factory.core.prompt import PromptManager, PromptTemplate
from agent_factory.core.reliability import ResourceLimits
from agent_factory.core.security import RiskLevel, SecretStore, ToolPermission
from agent_factory.core.state import AgentStateEnum, ExecutionContext
from agent_factory.memory.conversation import ConversationEngine
from agent_factory.memory.episodic import EpisodicMemory
from agent_factory.memory.governance import ContextBuilder
from agent_factory.memory.semantic import SemanticMemory
from agent_factory.memory.working import WorkingMemory
from agent_factory.observability.audit import AuditLogger
from agent_factory.observability.metrics import AgentAnalytics
from agent_factory.observability.tracer import Tracer
from agent_factory.orchestration.planner import PlanningEngine
from agent_factory.orchestration.workflow import WorkflowEngine
from agent_factory.tools.approval import HumanApprovalQueue
from agent_factory.tools.base import BaseTool
from agent_factory.tools.builtins.browser import BrowserTool
from agent_factory.tools.builtins.code_exec import PythonSandboxTool
from agent_factory.tools.builtins.files import FileProcessingTool
from agent_factory.tools.builtins.search import WebSearchTool
from agent_factory.tools.registry import ToolRegistry
from agent_factory.validation.citations import CitationEngine
from agent_factory.validation.structured import StructuredOutputEngine
from agent_factory.validation.verification import SelfVerificationEngine
from agent_factory.memory.rag import KnowledgeBase
from agent_factory.core.lifecycle import CanaryDeploymentManager

T = TypeVar("T", bound=BaseModel)


class AgentInstance:
    """An independent, fully assembled production agent product."""

    def __init__(
        self,
        manifest: AgentManifest,
        gateway: LLMGateway,
        tool_registry: ToolRegistry,
        workflow_engine: WorkflowEngine,
        planner: PlanningEngine,
        conversation_engine: ConversationEngine,
        context_builder: ContextBuilder,
        working_memory: WorkingMemory,
        semantic_memory: SemanticMemory,
        episodic_memory: EpisodicMemory,
        structured_engine: StructuredOutputEngine,
        verification_engine: SelfVerificationEngine,
        citation_engine: CitationEngine,
        tracer: Tracer,
        audit_logger: AuditLogger,
        analytics: AgentAnalytics,
        approval_queue: HumanApprovalQueue,
    ):
        self.manifest = manifest
        self.agent_id = manifest.identity.agent_id
        self.agent_name = manifest.identity.agent_name
        self.config = manifest.config

        self.gateway = gateway
        self.tool_registry = tool_registry
        self.workflow_engine = workflow_engine
        self.planner = planner
        self.conversation_engine = conversation_engine
        self.context_builder = context_builder
        self.working_memory = working_memory
        self.semantic_memory = semantic_memory
        self.episodic_memory = episodic_memory
        self.structured_engine = structured_engine
        self.verification_engine = verification_engine
        self.citation_engine = citation_engine
        self.tracer = tracer
        self.audit_logger = audit_logger
        self.analytics = analytics
        self.approval_queue = approval_queue
        self.knowledge_base = KnowledgeBase(agent_id=self.agent_id)

        self._active_contexts: Dict[str, ExecutionContext] = {}

    async def run(
        self,
        goal: str,
        variables: Optional[Dict[str, Any]] = None,
        thread_id: Optional[str] = None
    ) -> str:
        """Executes a goal through the complete production agent pipeline."""
        start_time = time.time()
        task_id = str(uuid.uuid4())
        span = self.tracer.start_span(name=f"agent_run_{self.agent_id}", attributes={"goal": goal, "task_id": task_id})

        self.analytics.record_task_start(self.agent_id)
        self.audit_logger.log(
            action="task_started",
            actor_id=self.agent_id,
            resource=f"task:{task_id}",
            status="SUCCESS",
            details={"goal": goal}
        )

        context = ExecutionContext(
            task_id=task_id,
            agent_id=self.agent_id,
            goal=goal,
            variables=variables or {}
        )
        self._active_contexts[task_id] = context
        self.working_memory.current_objective = goal

        # 1. Build optimized context
        opt_context = self.context_builder.build_context(goal)

        # 2. Planning phase
        available_tool_names = list(self.tool_registry._tools.keys())
        plan = await self.planner.create_plan(
            goal=goal,
            available_tools=available_tool_names,
            context_summary=opt_context
        )
        self.working_memory.current_plan = [s.name for s in plan.steps]

        # 3. Execution phase via WorkflowEngine
        await self.workflow_engine.execute_plan(
            plan=plan,
            context=context,
            agent_role=self.manifest.identity.agent_id
        )

        duration = time.time() - start_time
        success = context.state == AgentStateEnum.COMPLETED

        # 4. Handle awaiting human approval
        if context.state == AgentStateEnum.WAITING_FOR_APPROVAL:
            span.end(status="WAITING_APPROVAL")
            return f"Agent execution paused: {context.pending_approval_id}. Resume after human review."

        if not success:
            span.end(status="FAILED", error=context.error)
            self.analytics.record_task_finish(self.agent_id, False, duration, 0, 0.0)
            return f"Agent execution failed: {context.error}"

        # 5. Compile final answer from step history
        outputs = [f"- {s.step_name}: {s.output_data}" for s in context.step_history if s.output_data]
        final_answer = f"### Completed Task: {goal}\n\nExecution Summary:\n" + "\n".join(outputs)

        # 6. Record episodic memory for future continuous improvement
        self.episodic_memory.record_episode(
            task_goal=goal,
            actions_taken=[s.step_name for s in context.step_history],
            outcome=final_answer[:200],
            success=True,
            lessons_learned=["Steps executed successfully in sequence."],
            tags=self.manifest.identity.tags
        )

        span.end(status="OK")
        self.analytics.record_task_finish(self.agent_id, True, duration, 100, 0.001)
        return final_answer

    async def run_structured(self, goal: str, output_schema: Type[T]) -> T:
        """Runs the agent and forces a structured Pydantic schema response."""
        return await self.structured_engine.generate_structured(
            prompt=goal,
            output_schema=output_schema,
            model=self.config.primary_model
        )


class AgentFactory:
    """The central factory builder assembling agents from capability modules."""

    def __init__(
        self,
        gateway: Optional[LLMGateway] = None,
        secret_store: Optional[SecretStore] = None
    ):
        self.gateway = gateway or LLMGateway(providers={"default": MockProvider()})
        self.secret_store = secret_store or SecretStore()
        self.approval_queue = HumanApprovalQueue()
        self.tracer = Tracer()
        self.audit_logger = AuditLogger()
        self.analytics = AgentAnalytics()
        self.canary_manager = CanaryDeploymentManager()

    def build_agent(
        self,
        manifest: AgentManifest,
        custom_tools: Optional[List[BaseTool]] = None
    ) -> AgentInstance:
        """Assembles and returns an independent production AgentInstance."""
        # 1. Initialize Tool Registry and register capabilities
        tool_registry = ToolRegistry(approval_queue=self.approval_queue)

        # Standard builtin tools
        builtin_tools: Dict[str, BaseTool] = {
            "web_search": WebSearchTool(),
            "browser": BrowserTool(),
            "python_sandbox": PythonSandboxTool(),
            "file_processor": FileProcessingTool(),
        }

        # Enable tools specified in config or capabilities
        for t_name, tool in builtin_tools.items():
            if t_name in manifest.config.enabled_tools or any(cap in t_name for cap in manifest.capabilities):
                tool_registry.register(tool)

        if custom_tools:
            for c_tool in custom_tools:
                tool_registry.register(c_tool)

        # 2. Initialize Memory modules
        working_memory = WorkingMemory()
        conversation_engine = ConversationEngine()
        semantic_memory = SemanticMemory()
        episodic_memory = EpisodicMemory()
        context_builder = ContextBuilder(
            working_memory=working_memory,
            semantic_memory=semantic_memory,
            episodic_memory=episodic_memory
        )

        # 3. Initialize Orchestration & Validation
        planner = PlanningEngine(gateway=self.gateway)
        workflow_engine = WorkflowEngine(
            tool_registry=tool_registry,
            gateway=self.gateway,
            resource_limits=ResourceLimits(
                max_steps=manifest.config.max_iterations,
                max_execution_time_seconds=manifest.config.timeout_seconds
            )
        )
        structured_engine = StructuredOutputEngine(gateway=self.gateway)
        verification_engine = SelfVerificationEngine(gateway=self.gateway)
        citation_engine = CitationEngine()

        return AgentInstance(
            manifest=manifest,
            gateway=self.gateway,
            tool_registry=tool_registry,
            workflow_engine=workflow_engine,
            planner=planner,
            conversation_engine=conversation_engine,
            context_builder=context_builder,
            working_memory=working_memory,
            semantic_memory=semantic_memory,
            episodic_memory=episodic_memory,
            structured_engine=structured_engine,
            verification_engine=verification_engine,
            citation_engine=citation_engine,
            tracer=self.tracer,
            audit_logger=self.audit_logger,
            analytics=self.analytics,
            approval_queue=self.approval_queue,
        )
