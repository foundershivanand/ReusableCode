"""
Lifecycle Package: Versioning, Canary Deployments, and Rollback.
"""

from agent_factory.core.lifecycle import (
    CanaryDeploymentManager,
    VersionedAgentRecord,
    DeploymentStatus,
)

__all__ = [
    "CanaryDeploymentManager",
    "VersionedAgentRecord",
    "DeploymentStatus",
]
