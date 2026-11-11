"""
Module 09 & 10: Token & Context Management and Cost Economics
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    def add(self, other: "TokenUsage") -> "TokenUsage":
        return TokenUsage(
            input_tokens=self.input_tokens + other.input_tokens,
            output_tokens=self.output_tokens + other.output_tokens,
            cached_tokens=self.cached_tokens + other.cached_tokens,
        )


class ModelPricing(BaseModel):
    """Pricing in USD per 1M tokens."""
    input_per_million: float
    output_per_million: float
    cached_input_per_million: float = 0.0

    def calculate_cost(self, usage: TokenUsage) -> float:
        regular_input = max(0, usage.input_tokens - usage.cached_tokens)
        cost_input = (regular_input / 1_000_000.0) * self.input_per_million
        cost_cached = (usage.cached_tokens / 1_000_000.0) * self.cached_input_per_million
        cost_output = (usage.output_tokens / 1_000_000.0) * self.output_per_million
        return round(cost_input + cost_cached + cost_output, 6)


# Default known model pricings (per 1M tokens)
DEFAULT_PRICING: Dict[str, ModelPricing] = {
    "gpt-4o": ModelPricing(input_per_million=5.0, output_per_million=15.0, cached_input_per_million=2.5),
    "gpt-4o-mini": ModelPricing(input_per_million=0.15, output_per_million=0.60, cached_input_per_million=0.075),
    "claude-3-5-sonnet-20241022": ModelPricing(input_per_million=3.0, output_per_million=15.0, cached_input_per_million=0.30),
    "claude-3-5-haiku-20241022": ModelPricing(input_per_million=0.80, output_per_million=4.0, cached_input_per_million=0.08),
    "gemini-1.5-pro": ModelPricing(input_per_million=3.5, output_per_million=10.5, cached_input_per_million=0.875),
    "gemini-1.5-flash": ModelPricing(input_per_million=0.075, output_per_million=0.30, cached_input_per_million=0.01875),
    "mock-model": ModelPricing(input_per_million=0.0, output_per_million=0.0),
}


class ExecutionCostRecord(BaseModel):
    task_id: str
    agent_id: str
    model: str
    usage: TokenUsage
    cost_usd: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CostManager:
    """Module 10: Tracks costs, enforces budget limits, and triggers alerts/downgrades."""

    def __init__(
        self,
        max_cost_per_task: float = 2.0,
        max_cost_per_day: float = 50.0,
        pricing_table: Optional[Dict[str, ModelPricing]] = None,
    ):
        self.max_cost_per_task = max_cost_per_task
        self.max_cost_per_day = max_cost_per_day
        self.pricing_table = pricing_table or DEFAULT_PRICING
        self._records: List[ExecutionCostRecord] = []

    def get_pricing(self, model: str) -> ModelPricing:
        # Match exact or fallback to a default mini price
        return self.pricing_table.get(model, ModelPricing(input_per_million=1.0, output_per_million=3.0))

    def record_usage(self, task_id: str, agent_id: str, model: str, usage: TokenUsage) -> ExecutionCostRecord:
        pricing = self.get_pricing(model)
        cost = pricing.calculate_cost(usage)
        record = ExecutionCostRecord(
            task_id=task_id,
            agent_id=agent_id,
            model=model,
            usage=usage,
            cost_usd=cost
        )
        self._records.append(record)
        return record

    def get_task_cost(self, task_id: str) -> float:
        return sum(r.cost_usd for r in self._records if r.task_id == task_id)

    def get_total_cost(self, agent_id: Optional[str] = None) -> float:
        if agent_id:
            return sum(r.cost_usd for r in self._records if r.agent_id == agent_id)
        return sum(r.cost_usd for r in self._records)

    def check_budget_exceeded(self, task_id: str) -> bool:
        return self.get_task_cost(task_id) >= self.max_cost_per_task
