"""
Module 22 & 23: Tool Base Specification and Invocation Contracts
"""

import abc
from typing import Any, Dict, Optional, Type
from pydantic import BaseModel, Field

from agent_factory.core.security import RiskLevel


class ToolExecutionResult(BaseModel):
    tool_name: str
    success: bool
    output: Any = None
    error: Optional[str] = None
    duration_seconds: float = 0.0


class BaseTool(abc.ABC):
    """Abstract base class for all agent factory tools."""
    tool_id: str
    name: str
    description: str
    risk_level: RiskLevel = RiskLevel.LOW
    requires_human_approval: bool = False
    timeout_seconds: float = 30.0
    input_schema: Type[BaseModel]
    output_schema: Optional[Type[BaseModel]] = None

    def get_json_schema(self) -> Dict[str, Any]:
        """Returns standard OpenAI / JSON Schema format for function calling."""
        schema = self.input_schema.model_json_schema()
        # Clean schema for model ingestion
        schema.pop("title", None)
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": schema
            }
        }

    @abc.abstractmethod
    async def execute(self, **kwargs: Any) -> Any:
        """Core execution logic of the tool."""
        pass
