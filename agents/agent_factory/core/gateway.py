"""
Module 06, 07 & 08: LLM Gateway, Model Routing, and Multi-Provider Fallback
"""

import abc
import asyncio
import logging
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.cost import CostManager, TokenUsage

logger = logging.getLogger(__name__)


class TaskComplexity(str, Enum):
    SIMPLE = "simple"         # Classification, summarization, extraction -> Cheap / Fast model
    STANDARD = "standard"     # General reasoning, planning, tool usage -> Standard model
    ADVANCED = "advanced"     # Multi-step deep reasoning, synthesis -> Flagship model


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class LLMMessage(BaseModel):
    role: str  # "system", "user", "assistant", "tool"
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None
    name: Optional[str] = None


class LLMRequest(BaseModel):
    messages: List[LLMMessage]
    model: str
    temperature: float = 0.2
    max_tokens: int = 2048
    tools: Optional[List[Dict[str, Any]]] = None
    task_complexity: TaskComplexity = TaskComplexity.STANDARD


class LLMResponse(BaseModel):
    content: Optional[str] = None
    tool_calls: List[ToolCall] = Field(default_factory=list)
    model: str
    usage: TokenUsage = Field(default_factory=TokenUsage)
    finish_reason: str = "stop"
    raw: Optional[Dict[str, Any]] = None


class BaseProvider(abc.ABC):
    """Abstract provider interface."""
    @abc.abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        pass


class MockProvider(BaseProvider):
    """Deterministic mock provider for unit testing and offline development."""
    def __init__(self, canned_responses: Optional[List[LLMResponse]] = None):
        self.canned_responses = canned_responses or []
        self._index = 0
        self.call_history: List[LLMRequest] = []

    async def complete(self, request: LLMRequest) -> LLMResponse:
        self.call_history.append(request)
        if self.canned_responses and self._index < len(self.canned_responses):
            resp = self.canned_responses[self._index]
            self._index += 1
            return resp
        
        # Default mock response
        last_msg = request.messages[-1].content if request.messages else ""
        return LLMResponse(
            content=f"[Mock Response to: {last_msg[:40]}]",
            model=request.model,
            usage=TokenUsage(input_tokens=50, output_tokens=30),
            finish_reason="stop"
        )


class OpenAICompatibleProvider(BaseProvider):
    """Supports OpenAI, Groq, Ollama, Together, OpenRouter, vLLM via standard HTTP API."""

    def __init__(self, api_key: str = "mock-key", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    async def complete(self, request: LLMRequest) -> LLMResponse:
        import httpx
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload: Dict[str, Any] = {
            "model": request.model,
            "messages": [m.model_dump(exclude_none=True) for m in request.messages],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        if request.tools:
            payload["tools"] = request.tools

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        choice = data["choices"][0]["message"]
        tool_calls = []
        if "tool_calls" in choice and choice["tool_calls"]:
            import json
            for tc in choice["tool_calls"]:
                tool_calls.append(
                    ToolCall(
                        id=tc["id"],
                        name=tc["function"]["name"],
                        arguments=json.loads(tc["function"]["arguments"])
                    )
                )

        usage_data = data.get("usage", {})
        usage = TokenUsage(
            input_tokens=usage_data.get("prompt_tokens", 0),
            output_tokens=usage_data.get("completion_tokens", 0),
            cached_tokens=usage_data.get("prompt_tokens_details", {}).get("cached_tokens", 0) if "prompt_tokens_details" in usage_data else 0
        )

        return LLMResponse(
            content=choice.get("content"),
            tool_calls=tool_calls,
            model=data.get("model", request.model),
            usage=usage,
            finish_reason=data["choices"][0].get("finish_reason", "stop"),
            raw=data
        )


class ModelRouter:
    """Module 07: Automatically routes requests to appropriate model based on complexity and policy."""

    def __init__(self, routing_map: Optional[Dict[TaskComplexity, str]] = None):
        self.routing_map = routing_map or {
            TaskComplexity.SIMPLE: "gpt-4o-mini",
            TaskComplexity.STANDARD: "gpt-4o",
            TaskComplexity.ADVANCED: "gpt-4o",
        }

    def resolve_model(self, requested_model: Optional[str], complexity: TaskComplexity) -> str:
        if requested_model:
            return requested_model
        return self.routing_map.get(complexity, "gpt-4o-mini")


class LLMGateway:
    """Module 06 & 08: Unified LLM Gateway with cascading fallback, routing, and cost tracking."""

    def __init__(
        self,
        providers: Optional[Dict[str, BaseProvider]] = None,
        router: Optional[ModelRouter] = None,
        cost_manager: Optional[CostManager] = None
    ):
        self.providers: Dict[str, BaseProvider] = providers or {"default": MockProvider()}
        self.router = router or ModelRouter()
        self.cost_manager = cost_manager or CostManager()

    def register_provider(self, name: str, provider: BaseProvider) -> None:
        self.providers[name] = provider

    def _get_provider_for_model(self, model: str) -> BaseProvider:
        # Check if a model-specific provider exists, else use default
        if model in self.providers:
            return self.providers[model]
        return self.providers.get("default", next(iter(self.providers.values())))

    async def execute(
        self,
        request: LLMRequest,
        task_id: str = "default_task",
        agent_id: str = "default_agent",
        fallback_models: Optional[List[str]] = None
    ) -> LLMResponse:
        """Executes LLM request with automatic cascading fallback across models."""
        target_model = self.router.resolve_model(request.model, request.task_complexity)
        models_to_try = [target_model] + (fallback_models or [])

        last_exception: Optional[Exception] = None
        for model in models_to_try:
            req = request.model_copy(update={"model": model})
            provider = self._get_provider_for_model(model)
            try:
                response = await provider.complete(req)
                # Track token and cost economics
                self.cost_manager.record_usage(
                    task_id=task_id,
                    agent_id=agent_id,
                    model=response.model,
                    usage=response.usage
                )
                return response
            except Exception as e:
                logger.warning(f"Model '{model}' failed: {e}. Attempting fallback...")
                last_exception = e
                continue

        raise RuntimeError(f"All models failed in fallback chain {models_to_try}. Last error: {last_exception}")
