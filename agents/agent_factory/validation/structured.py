"""
Module 34 & 35: Structured Output Engine and Schema Validation
"""

import json
import re
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError

from agent_factory.core.gateway import LLMGateway, LLMMessage, LLMRequest

T = TypeVar("T", bound=BaseModel)


class StructuredOutputEngine:
    """Forces LLMs to return strict, typed Pydantic models with schema validation and repair."""

    def __init__(self, gateway: LLMGateway):
        self.gateway = gateway

    @staticmethod
    def extract_json(text: str) -> str:
        """Extracts JSON substring from markdown backticks or raw response."""
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        # Fallback to finding outermost brackets
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace:last_brace + 1].strip()
        return text.strip()

    async def generate_structured(
        self,
        prompt: str,
        output_schema: Type[T],
        model: str = "gpt-4o",
        max_repair_attempts: int = 2
    ) -> T:
        """Generates output and guarantees adherence to the target Pydantic schema."""
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        system_prompt = (
            "You are a strict structured-output generator. You must respond ONLY with valid JSON "
            "matching the following JSON Schema:\n"
            f"{schema_json}\n"
            "Do NOT include any explanatory text outside the JSON."
        )

        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=prompt)
        ]

        for attempt in range(max_repair_attempts + 1):
            req = LLMRequest(
                messages=messages,
                model=model,
                temperature=0.0
            )
            resp = await self.gateway.execute(req)
            raw_text = resp.content or ""
            json_str = self.extract_json(raw_text)

            try:
                data = json.loads(json_str)
                return output_schema(**data)
            except (json.JSONDecodeError, ValidationError) as err:
                if attempt == max_repair_attempts:
                    raise ValueError(
                        f"Failed to produce valid structured output for {output_schema.__name__} "
                        f"after {max_repair_attempts + 1} attempts. Error: {err}\nRaw text: {raw_text}"
                    )
                # Repair feedback loop
                messages.append(LLMMessage(role="assistant", content=raw_text))
                messages.append(LLMMessage(
                    role="user",
                    content=f"Your previous response had a validation error: {err}. "
                            f"Please correct the JSON and return only the valid JSON."
                ))
        raise RuntimeError("Unreachable")
