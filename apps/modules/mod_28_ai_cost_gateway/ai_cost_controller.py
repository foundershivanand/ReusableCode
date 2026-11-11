#!/usr/bin/env python3
import time
from typing import Dict, Optional

class AiCostController:
    # Model Costs per 1k tokens in USD
    MODEL_COSTS = {
        "fast": {"prompt": 0.00015, "completion": 0.0006}, # e.g. Claude 3.5 Haiku
        "pro":  {"prompt": 0.003,   "completion": 0.015}   # e.g. Claude 3.5 Sonnet
    }

    # Daily Token Caps per User Tier
    TIER_DAILY_TOKEN_LIMITS = {
        "free": 10000,       # ~7-10 generations/day
        "pro": 250000,       # ~200 generations/day
        "enterprise": 2000000 # Unlimited/heavy team usage
    }

    def __init__(self):
        self._user_daily_tokens: Dict[str, Dict[str, any]] = {}

    def can_generate(self, user_id: str, user_tier: str, estimated_tokens: int) -> bool:
        limit = self.TIER_DAILY_TOKEN_LIMITS.get(user_tier, 10000)
        user_record = self._get_or_reset_user(user_id)
        return (user_record["tokens_used"] + estimated_tokens) <= limit

    def record_usage(self, user_id: str, prompt_tokens: int, completion_tokens: int, model_tier: str) -> float:
        user_record = self._get_or_reset_user(user_id)
        total_tokens = prompt_tokens + completion_tokens
        user_record["tokens_used"] += total_tokens

        cost_cfg = self.MODEL_COSTS.get(model_tier, self.MODEL_COSTS["fast"])
        cost_usd = (prompt_tokens / 1000.0 * cost_cfg["prompt"]) + (completion_tokens / 1000.0 * cost_cfg["completion"])
        user_record["cost_usd"] += cost_usd
        return cost_usd

    def _get_or_reset_user(self, user_id: str) -> dict:
        now = time.time()
        record = self._user_daily_tokens.get(user_id)
        if not record or (now - record["reset_at"]) >= 86400:
            record = {"tokens_used": 0, "cost_usd": 0.0, "reset_at": now}
            self._user_daily_tokens[user_id] = record
        return record
