"""
Module 01 & 02: Agent Identity & Central Configuration
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    DRAFT = "draft"
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"


class AgentEnvironment(str, Enum):
    LOCAL = "local"
    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"


class AgentIdentity(BaseModel):
    """Module 01: Unique identity, metadata, and lifecycle status of an agent."""
    agent_id: str = Field(..., description="Unique identifier for the agent (e.g. 'research-agent-01')")
    agent_name: str = Field(..., description="Human-readable name of the agent")
    description: str = Field(..., description="Summary of the agent's purpose and specialization")
    version: str = Field(default="1.0.0", description="Semantic version string")
    environment: AgentEnvironment = Field(default=AgentEnvironment.LOCAL)
    owner: str = Field(default="system", description="Owner or team responsible for this agent")
    status: AgentStatus = Field(default=AgentStatus.DEVELOPMENT)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RetryPolicyConfig(BaseModel):
    max_retries: int = Field(default=3, ge=0)
    initial_delay_seconds: float = Field(default=1.0, ge=0.1)
    backoff_multiplier: float = Field(default=2.0, ge=1.0)
    max_delay_seconds: float = Field(default=30.0, ge=1.0)


class CostLimitsConfig(BaseModel):
    max_cost_per_task: float = Field(default=1.0, description="Max USD per single task execution")
    max_cost_per_day: float = Field(default=50.0, description="Daily budget limit in USD")
    alert_threshold_percent: float = Field(default=80.0, description="Percentage of budget to trigger alert")


class AgentConfig(BaseModel):
    """Module 02: Central configuration layer governing execution and intelligence."""
    system_prompt: str = Field(..., description="Base system instructions")
    primary_model: str = Field(default="gpt-4o", description="Primary model identifier")
    fallback_models: List[str] = Field(default_factory=lambda: ["gpt-4o-mini", "claude-3-5-sonnet-20241022"])
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1)
    timeout_seconds: float = Field(default=120.0, ge=1.0)
    max_iterations: int = Field(default=25, ge=1, description="Max planning/execution loops")
    retry_policy: RetryPolicyConfig = Field(default_factory=RetryPolicyConfig)
    cost_limits: CostLimitsConfig = Field(default_factory=CostLimitsConfig)
    enabled_tools: List[str] = Field(default_factory=list)
    feature_flags: Dict[str, bool] = Field(default_factory=dict)


class AgentManifest(BaseModel):
    """Complete specification to assemble an agent in the factory."""
    identity: AgentIdentity
    config: AgentConfig
    capabilities: List[str] = Field(
        default_factory=list,
        description="Names of capability bundles (e.g., 'web_research', 'code_sandbox', 'rag')"
    )
