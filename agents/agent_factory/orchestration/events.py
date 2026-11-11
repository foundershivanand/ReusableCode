"""
Module 43, 44 & 45: Event System, Trigger Engine, and Background Job Queue
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentEvent(BaseModel):
    """Module 43: Reactive events triggering agent workflows."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # e.g., "webhook.received", "schedule.cron", "data.threshold"
    source: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EventBus:
    """Pub/Sub event bus for asynchronous system reactivity."""

    def __init__(self):
        self._handlers: Dict[str, List[Callable[[AgentEvent], Any]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[AgentEvent], Any]) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: AgentEvent) -> None:
        handlers = self._handlers.get(event.event_type, [])
        handlers += self._handlers.get("*", [])  # Wildcard listeners
        for handler in handlers:
            if asyncio.iscoroutinefunction(handler):
                asyncio.create_task(handler(event))
            else:
                handler(event)


class BackgroundJobQueue:
    """Module 45: Asynchronous queue for long-running agent tasks."""

    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._running: bool = False
        self._worker_task: Optional[asyncio.Task] = None

    async def enqueue(self, task_func: Callable, *args: Any, **kwargs: Any) -> str:
        job_id = str(uuid.uuid4())
        await self._queue.put((job_id, task_func, args, kwargs))
        return job_id

    async def start_worker(self) -> None:
        self._running = True
        while self._running:
            try:
                job_id, task_func, args, kwargs = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                try:
                    if asyncio.iscoroutinefunction(task_func):
                        await task_func(*args, **kwargs)
                    else:
                        task_func(*args, **kwargs)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Background job '{job_id}' failed: {e}", exc_info=True)
                finally:
                    self._queue.task_done()
            except asyncio.TimeoutError:
                continue

    def stop_worker(self) -> None:
        self._running = False
