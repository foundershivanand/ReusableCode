"""
Template 02: Content Generation Agent
Capabilities: Trend Detection, Content Generation, Structured Output, Human Approval, Scheduling.
"""

from agent_factory.core.identity import AgentConfig, AgentIdentity, AgentManifest, AgentStatus
from agent_factory.factory import AgentFactory, AgentInstance


def create_content_agent(factory: AgentFactory) -> AgentInstance:
    manifest = AgentManifest(
        identity=AgentIdentity(
            agent_id="content-agent-v1",
            agent_name="Autonomous Content Strategy & Generation Agent",
            description="Analyzes trends, crafts high-engagement articles, and structures social copy with human approval.",
            version="1.0.0",
            status=AgentStatus.PRODUCTION,
            tags=["content", "copywriting", "seo", "social"]
        ),
        config=AgentConfig(
            system_prompt=(
                "You are an expert Content Strategist and Copywriter. You research market trends, "
                "develop targeted content outlines, and generate compelling articles."
            ),
            primary_model="gpt-4o",
            fallback_models=["gpt-4o-mini"],
            temperature=0.7,
            max_tokens=4096,
            enabled_tools=["web_search", "browser"],
        ),
        capabilities=["web_search", "browser", "structured_output"]
    )

    return factory.build_agent(manifest)
