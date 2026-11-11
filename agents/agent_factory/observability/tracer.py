"""
Module 65 & 66: Distributed Tracing and Observability
"""

import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Span(BaseModel):
    span_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str
    parent_span_id: Optional[str] = None
    name: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    start_time: float = Field(default_factory=time.time)
    end_time: Optional[float] = None
    status: str = "OK"
    error: Optional[str] = None

    def end(self, status: str = "OK", error: Optional[str] = None) -> None:
        self.end_time = time.time()
        self.status = status
        self.error = error

    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return round(self.end_time - self.start_time, 4)
        return round(time.time() - self.start_time, 4)


class Tracer:
    """Module 66: Distributed tracer generating trace and span hierarchies."""

    def __init__(self):
        self._spans: List[Span] = []

    def start_span(
        self,
        name: str,
        trace_id: Optional[str] = None,
        parent_span_id: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None
    ) -> Span:
        t_id = trace_id or str(uuid.uuid4())
        span = Span(
            trace_id=t_id,
            parent_span_id=parent_span_id,
            name=name,
            attributes=attributes or {}
        )
        self._spans.append(span)
        return span

    def get_trace_spans(self, trace_id: str) -> List[Span]:
        return [s for s in self._spans if s.trace_id == trace_id]
