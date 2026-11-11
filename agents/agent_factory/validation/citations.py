"""
Module 38: Citation Engine
Associates claims with sources, tracks provenance, and formats citations.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    citation_id: int
    source_title: str
    url_or_ref: str
    snippet: Optional[str] = None


class CitationEngine:
    """Manages sources and generates academic/business citations in outputs."""

    def __init__(self):
        self._sources: List[Citation] = []

    def add_source(self, source_title: str, url_or_ref: str, snippet: Optional[str] = None) -> int:
        for s in self._sources:
            if s.url_or_ref == url_or_ref:
                return s.citation_id

        cit_id = len(self._sources) + 1
        self._sources.append(
            Citation(citation_id=cit_id, source_title=source_title, url_or_ref=url_or_ref, snippet=snippet)
        )
        return cit_id

    def format_bibliography(self) -> str:
        """Formats collected citations as a clean markdown bibliography."""
        if not self._sources:
            return ""
        lines = ["### References & Sources:"]
        for s in self._sources:
            snippet_str = f" — *\"{s.snippet[:80]}...\"*" if s.snippet else ""
            lines.append(f"[{s.citation_id}] [{s.source_title}]({s.url_or_ref}){snippet_str}")
        return "\n".join(lines)
