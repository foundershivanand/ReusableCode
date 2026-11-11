"""
Template 01: Research Agent
Capabilities: Web Search, Browser, Research Pipeline, Semantic Memory, Citations, Fact Verification.
"""

from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest, AgentStatus
from agent_factory.factory import AgentFactory, AgentInstance


def create_research_agent(factory: AgentFactory) -> AgentInstance:
    manifest = AgentManifest(
        identity=AgentIdentity(
            agent_id="research-agent-v1",
            agent_name="Autonomous Web & Deep Research Agent",
            description="Researches topics across the web, extracts evidence, cross-checks facts, and formats citations.",
            version="1.0.0",
            status=AgentStatus.PRODUCTION,
            tags=["research", "web", "citations", "fact-checking"]
        ),
        config=AgentConfig(
            system_prompt=(
                "You are an elite Research Agent. Your job is to gather evidence from the web, "
                "verify sources, cite evidence objectively, and synthesize high-confidence findings."
            ),
            primary_model="gpt-4o",
            fallback_models=["gpt-4o-mini"],
            temperature=0.1,
            max_tokens=4096,
            enabled_tools=["web_search", "browser", "file_processor"],
        ),
        capabilities=["web_search", "browser", "citation_engine", "fact_verification"]
    )

    return factory.build_agent(manifest)
