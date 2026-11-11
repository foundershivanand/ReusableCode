"""
Template 03: Coding and Data Analysis Agent
Capabilities: Python Sandbox, File Processing, Fact Verification, AST Security.
"""

from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest, AgentStatus
from agent_factory.factory import AgentFactory, AgentInstance


def create_coding_agent(factory: AgentFactory) -> AgentInstance:
    manifest = AgentManifest(
        identity=AgentIdentity(
            agent_id="coding-agent-v1",
            agent_name="Autonomous Coding & Data Analysis Agent",
            description="Generates, sandboxes, and verifies Python code and processes structured data files.",
            version="1.0.0",
            status=AgentStatus.PRODUCTION,
            tags=["coding", "python", "data-analysis", "sandbox"]
        ),
        config=AgentConfig(
            system_prompt=(
                "You are an expert Python Software Engineer and Data Analyst. You write clean, "
                "performant code and execute it in an isolated sandbox to verify results before returning answers."
            ),
            primary_model="gpt-4o",
            fallback_models=["gpt-4o-mini"],
            temperature=0.0,
            max_tokens=4096,
            enabled_tools=["python_sandbox", "file_processor"],
        ),
        capabilities=["python_sandbox", "file_processor", "self_verification"]
    )

    return factory.build_agent(manifest)
