"""
Module 47, 48, 49, 50 & 60: Reliability, Loop Detection, Resource Limits, and Idempotency
"""

import asyncio
import hashlib
import json
import logging
import random
import time
from typing import Any, Callable, Dict, List, Optional, Set
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ResourceLimits(BaseModel):
    """Module 50: Protect infrastructure from runaway agents."""
    max_steps: int = Field(default=30, description="Max workflow steps")
    max_tokens: int = Field(default=100_000, description="Max cumulative tokens")
    max_tool_calls: int = Field(default=50, description="Max tool executions")
    max_execution_time_seconds: float = Field(default=300.0, description="Max runtime in seconds")
    max_spend_usd: float = Field(default=2.0, description="Max spend limit in USD")


class LoopDetector:
    """Module 49: Detects infinite loops or repeating cyclic tool calls."""

    def __init__(self, max_consecutive_duplicates: int = 3, history_window: int = 8):
        self.max_consecutive_duplicates = max_consecutive_duplicates
        self.history_window = history_window
        self._action_hashes: List[str] = []

    def _hash_action(self, action_type: str, payload: Any) -> str:
        serialized = json.dumps({"action": action_type, "payload": payload}, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def record_and_check(self, action_type: str, payload: Any) -> bool:
        """Records an action and returns True if a loop/cycle is detected."""
        h = self._hash_action(action_type, payload)
        self._action_hashes.append(h)

        # 1. Check exact consecutive duplicate threshold
        if len(self._action_hashes) >= self.max_consecutive_duplicates:
            recent = self._action_hashes[-self.max_consecutive_duplicates:]
            if len(set(recent)) == 1:
                logger.error(f"LoopDetector: Detected {self.max_consecutive_duplicates} consecutive identical actions ({action_type}).")
                return True

        # 2. Check 2-cycle repetition (A -> B -> A -> B)
        if len(self._action_hashes) >= 4:
            if self._action_hashes[-1] == self._action_hashes[-3] and self._action_hashes[-2] == self._action_hashes[-4]:
                logger.error("LoopDetector: Detected repeating 2-cycle action loop.")
                return True

        return False

    def reset(self) -> None:
        self._action_hashes.clear()


class RetryPolicy:
    """Module 47: Exponential backoff with jitter for transient failures."""

    def __init__(
        self,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        max_delay: float = 30.0,
        retryable_exceptions: Optional[tuple] = None
    ):
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.backoff_factor = backoff_factor
        self.max_delay = max_delay
        self.retryable_exceptions = retryable_exceptions or (Exception,)

    async def execute(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        attempt = 0
        current_delay = self.initial_delay

        while True:
            try:
                return await func(*args, **kwargs)
            except self.retryable_exceptions as e:
                attempt += 1
                if attempt > self.max_retries:
                    logger.error(f"RetryPolicy: Exceeded max retries ({self.max_retries}). Last error: {e}")
                    raise e

                # Apply exponential backoff with full jitter
                jitter = random.uniform(0.5, 1.5)
                sleep_time = min(self.max_delay, current_delay * jitter)
                logger.warning(f"RetryPolicy: Attempt {attempt}/{self.max_retries} failed ({e}). Retrying in {sleep_time:.2f}s...")
                await asyncio.sleep(sleep_time)
                current_delay *= self.backoff_factor


class IdempotencyManager:
    """Module 60: Guarantees that side-effecting operations are never executed twice."""

    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def compute_key(self, tool_name: str, arguments: Dict[str, Any], task_id: str) -> str:
        serialized = json.dumps({"tool": tool_name, "args": arguments, "task": task_id}, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def has_executed(self, key: str) -> bool:
        return key in self._cache

    def get_result(self, key: str) -> Any:
        return self._cache.get(key)

    def record_result(self, key: str, result: Any) -> None:
        self._cache[key] = result
