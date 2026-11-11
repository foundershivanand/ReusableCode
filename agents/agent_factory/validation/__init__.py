"""
Validation Layer: Structured Output, Self-Verification, and Citations.
"""

from agent_factory.validation.structured import StructuredOutputEngine
from agent_factory.validation.verification import (
    SelfVerificationEngine,
    VerificationResult,
    FactVerificationItem,
)
from agent_factory.validation.citations import CitationEngine, Citation

__all__ = [
    "StructuredOutputEngine",
    "SelfVerificationEngine",
    "VerificationResult",
    "FactVerificationItem",
    "CitationEngine",
    "Citation",
]
