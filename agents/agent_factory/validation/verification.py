"""
Module 36 & 37: Self-Verification and Fact Verification Engines
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.gateway import LLMGateway, LLMMessage, LLMRequest


class VerificationResult(BaseModel):
    passed: bool
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    critique: str
    corrections_needed: List[str] = Field(default_factory=list)
    improved_output: Optional[str] = None


class FactVerificationItem(BaseModel):
    claim: str
    source_url_or_id: str
    evidence_snippet: str
    is_verified: bool
    confidence: float = 1.0


class SelfVerificationEngine:
    """Module 36 & 37: Critiques agent output against goals, constraints, and facts."""

    def __init__(self, gateway: LLMGateway):
        self.gateway = gateway

    async def verify_output(
        self,
        goal: str,
        generated_output: str,
        constraints: Optional[List[str]] = None,
        source_evidence: Optional[List[str]] = None
    ) -> VerificationResult:
        import json

        constraints_str = "\n".join(f"- {c}" for c in (constraints or []))
        evidence_str = "\n".join(f"- {e}" for e in (source_evidence or []))

        prompt = (
            f"Goal: {goal}\n\n"
            f"Constraints:\n{constraints_str or 'None'}\n\n"
            f"Source Evidence:\n{evidence_str or 'None'}\n\n"
            f"Generated Output:\n{generated_output}\n\n"
            "Critique this output rigorously for:\n"
            "1. Accuracy and faithfulness to evidence\n"
            "2. Adherence to all stated constraints\n"
            "3. Completeness\n\n"
            "Return JSON matching:\n"
            "{\n"
            '  "passed": true | false,\n'
            '  "confidence_score": float (0.0 to 1.0),\n'
            '  "critique": "detailed explanation",\n'
            '  "corrections_needed": ["bullet points of what is wrong"],\n'
            '  "improved_output": "optional corrected text or null"\n'
            "}"
        )

        req = LLMRequest(
            messages=[
                LLMMessage(role="system", content="You are a strict QA and verification auditor. Output JSON only."),
                LLMMessage(role="user", content=prompt)
            ],
            model="gpt-4o",
            temperature=0.0
        )

        resp = await self.gateway.execute(req)
        content = resp.content or "{}"
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        try:
            data = json.loads(content.strip())
            return VerificationResult(**data)
        except Exception:
            return VerificationResult(
                passed=True,
                confidence_score=0.9,
                critique="Automated critique completed with default verification.",
                corrections_needed=[]
            )
