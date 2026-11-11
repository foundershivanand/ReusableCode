import time
from typing import Dict, List

class BehavioralAbuseDetector:
    MAX_TRACKED_USERS = 100000

    def __init__(self, action_threshold: int = 20, time_window_sec: int = 10, max_users: int = MAX_TRACKED_USERS):
        self.threshold = action_threshold
        self.window = time_window_sec
        self.max_users = max_users
        self.events: Dict[str, List[float]] = {}
        self._last_prune = time.time()

    def record_action(self, user_id: str) -> bool:
        if not user_id:
            return False

        now = time.time()
        if now - self._last_prune > 60:
            self._prune_inactive(now)
            self._last_prune = now

        history = self.events.setdefault(user_id, [])
        history.append(now)
        recent = [t for t in history if now - t <= self.window]
        self.events[user_id] = recent
        return len(recent) > self.threshold # True if abusive

    def _prune_inactive(self, now: float):
        inactive = [u for u, h in self.events.items() if not h or (now - h[-1] > self.window * 2)]
        for u in inactive:
            del self.events[u]
