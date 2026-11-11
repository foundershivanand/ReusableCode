"""
Module 72, 73 & 74: Agent Versioning, Canary Deployments, and Automated Rollback
"""

import random
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.identity import AgentManifest


class DeploymentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CANARY = "CANARY"
    ROLLED_BACK = "ROLLED_BACK"
    DEPRECATED = "DEPRECATED"


class VersionedAgentRecord(BaseModel):
    version: str
    manifest: AgentManifest
    status: DeploymentStatus = DeploymentStatus.CANARY
    traffic_percentage: float = Field(default=10.0, ge=0.0, le=100.0)
    error_count: int = 0
    total_calls: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def error_rate(self) -> float:
        return (self.error_count / self.total_calls) if self.total_calls > 0 else 0.0


class CanaryDeploymentManager:
    """Module 72 & 74: Traffic splitting and automated rollback on failure spikes."""

    def __init__(self, max_allowed_error_rate: float = 0.05, min_sample_size: int = 20):
        self.max_allowed_error_rate = max_allowed_error_rate
        self.min_sample_size = min_sample_size
        self._versions: Dict[str, VersionedAgentRecord] = {}
        self._primary_version: Optional[str] = None
        self._canary_version: Optional[str] = None

    def register_version(
        self,
        manifest: AgentManifest,
        is_canary: bool = False,
        canary_traffic_percent: float = 10.0
    ) -> None:
        v = manifest.identity.version
        record = VersionedAgentRecord(
            version=v,
            manifest=manifest,
            status=DeploymentStatus.CANARY if is_canary else DeploymentStatus.ACTIVE,
            traffic_percentage=canary_traffic_percent if is_canary else 100.0
        )
        self._versions[v] = record

        if is_canary:
            self._canary_version = v
        else:
            self._primary_version = v

    def select_version(self) -> VersionedAgentRecord:
        """Splits incoming traffic between primary version and canary version."""
        if not self._canary_version or self._canary_version not in self._versions:
            if not self._primary_version or self._primary_version not in self._versions:
                raise ValueError("No active agent versions deployed.")
            return self._versions[self._primary_version]

        canary_rec = self._versions[self._canary_version]
        # Roll random 0-100 to determine routing
        if random.uniform(0, 100) < canary_rec.traffic_percentage:
            return canary_rec
        return self._versions[self._primary_version]

    def record_execution(self, version: str, success: bool) -> None:
        rec = self._versions.get(version)
        if not rec:
            return

        rec.total_calls += 1
        if not success:
            rec.error_count += 1

        # Check for automated rollback trigger on canary
        if rec.status == DeploymentStatus.CANARY and rec.total_calls >= self.min_sample_size:
            if rec.error_rate > self.max_allowed_error_rate:
                self.trigger_rollback(
                    canary_version=version,
                    reason=f"Canary error rate ({rec.error_rate * 100:.1f}%) exceeded threshold ({self.max_allowed_error_rate * 100:.1f}%)"
                )

    def trigger_rollback(self, canary_version: str, reason: str) -> None:
        """Module 74: Immediate automated rollback of a failing canary version."""
        rec = self._versions.get(canary_version)
        if rec:
            rec.status = DeploymentStatus.ROLLED_BACK
            rec.traffic_percentage = 0.0
        self._canary_version = None
        import logging
        logging.getLogger(__name__).warning(f"ROLLBACK TRIGGERED for version {canary_version}: {reason}")
