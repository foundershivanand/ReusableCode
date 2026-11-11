"""
Module 19 & 20: Planning Engine and Task Decomposition
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.gateway import LLMGateway, LLMMessage, LLMRequest, TaskComplexity


class PlanStep(BaseModel):
    step_id: str
    name: str
    description: str
    tool_name: Optional[str] = None
    tool_arguments: Dict[str, Any] = Field(default_factory=dict)
    depends_on: List[str] = Field(default_factory=list, description="List of step_ids that must complete first")


class Plan(BaseModel):
    goal: str
    steps: List[PlanStep] = Field(default_factory=list)
    estimated_complexity: TaskComplexity = TaskComplexity.STANDARD


class PlanningEngine:
    """Module 19 & 20: Generates and decomposes complex goals into structured DAG execution plans."""

    def __init__(self, gateway: LLMGateway):
        self.gateway = gateway

    async def create_plan(
        self,
        goal: str,
        available_tools: List[str],
        context_summary: Optional[str] = None
    ) -> Plan:
        """Decomposes a goal into a concrete sequence of PlanSteps."""
        import json

        system_prompt = (
            "You are an expert AI Planner. Break down the user's goal into discrete executable steps.\n"
            "For each step, specify:\n"
            "- step_id (e.g. 'step_1', 'step_2')\n"
            "- name: Short title\n"
            "- description: What this step accomplishes\n"
            "- tool_name: Selected tool from available tools or null if pure reasoning\n"
            "- tool_arguments: Dict of arguments for the tool\n"
            "- depends_on: Array of previous step_ids required before running this step\n\n"
            f"Available Tools: {available_tools}\n"
            "Return ONLY a valid JSON object with the format:\n"
            "{\n"
            '  "steps": [...],\n'
            '  "complexity": "simple" | "standard" | "advanced"\n'
            "}"
        )

        messages = [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(
                role="user",
                content=f"Goal: {goal}\n\nContext:\n{context_summary or 'No additional context.'}"
            )
        ]

        req = LLMRequest(
            messages=messages,
            model="gpt-4o",
            temperature=0.1,
            task_complexity=TaskComplexity.STANDARD
        )

        response = await self.gateway.execute(req)
        content = response.content or "{}"

        # Clean JSON markdown if wrapped in ```json ... ```
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        try:
            parsed = json.loads(content.strip())
            steps = [PlanStep(**s) for s in parsed.get("steps", [])]
            complexity_str = parsed.get("complexity", "standard")
            complexity = TaskComplexity(complexity_str) if complexity_str in TaskComplexity._value2member_map_ else TaskComplexity.STANDARD
            return Plan(goal=goal, steps=steps, estimated_complexity=complexity)
        except Exception:
            # Fallback heuristic plan if model returns non-JSON
            return Plan(
                goal=goal,
                steps=[
                    PlanStep(
                        step_id="step_1",
                        name="Analyze and Execute Goal",
                        description=f"Direct execution of: {goal}",
                        tool_name="web_search" if "web_search" in available_tools else None,
                        tool_arguments={"query": goal} if "web_search" in available_tools else {},
                        depends_on=[]
                    )
                ],
                estimated_complexity=TaskComplexity.STANDARD
            )
