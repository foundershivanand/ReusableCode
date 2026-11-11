"""
Pre-configured Agent Templates: Research, Content, and Coding.
"""

from templates.research_agent import create_research_agent
from templates.content_agent import create_content_agent
from templates.coding_agent import create_coding_agent

__all__ = [
    "create_research_agent",
    "create_content_agent",
    "create_coding_agent",
]
