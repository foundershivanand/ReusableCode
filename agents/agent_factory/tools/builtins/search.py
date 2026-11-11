"""
Module 29 & 30: Web Search and Research Pipeline Tool
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.core.security import RiskLevel
from agent_factory.tools.base import BaseTool


class SearchInput(BaseModel):
    query: str = Field(..., description="The search query string")
    max_results: int = Field(default=5, ge=1, le=20)


class SearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str
    score: float = 1.0


class SearchOutput(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_found: int


class WebSearchTool(BaseTool):
    tool_id = "builtin_web_search"
    name = "web_search"
    description = "Searches the web for up-to-date information, news, documentation, and facts."
    risk_level = RiskLevel.LOW
    requires_human_approval = False
    input_schema = SearchInput
    output_schema = SearchOutput

    def __init__(self, search_provider_fn: Optional[Any] = None):
        self._provider = search_provider_fn

    async def execute(self, **kwargs: Any) -> Dict[str, Any]:
        params = self.input_schema(**kwargs)
        if self._provider:
            return await self._provider(params)

        # Built-in mock / fallback search generator
        mock_results = [
            SearchResultItem(
                title=f"Result 1 for '{params.query}'",
                url=f"https://example.com/search?q={params.query}&res=1",
                snippet=f"Detailed overview and key findings regarding {params.query}.",
                score=0.95
            ),
            SearchResultItem(
                title=f"Analysis & Documentation: {params.query}",
                url=f"https://example.org/docs/{params.query.replace(' ', '_')}",
                snippet=f"In-depth guide, specifications, and reference material for {params.query}.",
                score=0.88
            )
        ]
        return SearchOutput(
            query=params.query,
            results=mock_results[:params.max_results],
            total_found=len(mock_results)
        ).model_dump()
