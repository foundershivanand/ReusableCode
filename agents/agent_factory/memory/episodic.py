"""
Module 16: Episodic Memory
Captures past agent experiences, successes, failures, and lessons learned.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Episode(BaseModel):
    episode_id: str
    task_goal: str
    actions_taken: List[str] = Field(default_factory=list)
    outcome: str
    success: bool
    lessons_learned: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EpisodicMemory:
    """Stores and retrieves historical episodes to improve agent decision-making over time."""

    def __init__(self):
        self._episodes: List[Episode] = []

    def record_episode(
        self,
        task_goal: str,
        actions_taken: List[str],
        outcome: str,
        success: bool,
        lessons_learned: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Episode:
        import uuid
        ep = Episode(
            episode_id=str(uuid.uuid4()),
            task_goal=task_goal,
            actions_taken=actions_taken,
            outcome=outcome,
            success=success,
            lessons_learned=lessons_learned or [],
            tags=tags or []
        )
        self._episodes.append(ep)
        return ep

    def find_relevant_episodes(self, query: str, limit: int = 3) -> List[Episode]:
        """Simple keyword matching to retrieve relevant past experiences."""
        query_terms = set(query.lower().split())
        scored: List[tuple[int, Episode]] = []

        for ep in self._episodes:
            content = f"{ep.task_goal} {' '.join(ep.tags)} {' '.join(ep.lessons_learned)}".lower()
            score = sum(1 for term in query_terms if term in content)
            if score > 0:
                scored.append((score, ep))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [ep for _, ep in scored[:limit]]

    def format_for_prompt(self, episodes: List[Episode]) -> str:
        """Formats episodes as few-shot demonstrations for the agent prompt."""
        if not episodes:
            return ""
        blocks = ["Past Relevant Experiences:"]
        for ep in episodes:
            status_str = "SUCCESS" if ep.success else "FAILURE"
            lessons = "; ".join(ep.lessons_learned) if ep.lessons_learned else "None"
            blocks.append(
                f"- Task: {ep.task_goal}\n"
                f"  Status: {status_str}\n"
                f"  Key Actions: {', '.join(ep.actions_taken[:3])}\n"
                f"  Lessons Learned: {lessons}"
            )
        return "\n".join(blocks)
