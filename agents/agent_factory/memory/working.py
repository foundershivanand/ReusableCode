"""
Module 13: Working Memory
Temporary scratchpad and state for the currently active task.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class WorkingMemory(BaseModel):
    """Temporary working memory scoped strictly to the current task execution."""
    current_objective: str = ""
    current_plan: List[str] = Field(default_factory=list)
    findings: List[str] = Field(default_factory=list)
    scratchpad: Dict[str, Any] = Field(default_factory=dict)
    tool_outputs: Dict[str, Any] = Field(default_factory=dict)

    def add_finding(self, finding: str) -> None:
        self.findings.append(finding)

    def record_tool_output(self, step_id: str, output: Any) -> None:
        self.tool_outputs[step_id] = output

    def set_scratchpad_value(self, key: str, value: Any) -> None:
        self.scratchpad[key] = value

    def get_scratchpad_value(self, key: str, default: Any = None) -> Any:
        return self.scratchpad.get(key, default)

    def summarize_for_context(self) -> str:
        """Serializes working memory into a clean prompt context block."""
        parts = [f"Objective: {self.current_objective}"]
        if self.current_plan:
            parts.append("Plan:\n" + "\n".join(f"- {step}" for step in self.current_plan))
        if self.findings:
            parts.append("Key Findings:\n" + "\n".join(f"* {f}" for f in self.findings))
        if self.scratchpad:
            parts.append(f"Scratchpad: {self.scratchpad}")
        return "\n\n".join(parts)
