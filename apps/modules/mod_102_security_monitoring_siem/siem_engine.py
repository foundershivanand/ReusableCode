#!/usr/bin/env python3
import time
from typing import Dict, List

class SiemAnomalyDetector:
    MAX_TRACKED_IPS = 100000

    def __init__(self, max_ips: int = MAX_TRACKED_IPS):
        self.max_ips = max_ips
        self.failed_logins: Dict[str, List[float]] = {}
        self.api_spikes: Dict[str, List[float]] = {}
        self._last_prune = time.time()

    def record_failed_login(self, client_ip: str) -> bool:
        if not client_ip:
            return False

        now = time.time()
        if now - self._last_prune > 60:
            self._prune(now)
            self._last_prune = now

        timestamps = self.failed_logins.setdefault(client_ip, [])
        timestamps.append(now)
        # Check if >= 10 failed logins in 60 seconds
        recent = [t for t in timestamps if now - t <= 60]
        self.failed_logins[client_ip] = recent
        return len(recent) >= 10

    def record_api_request(self, user_id: str) -> bool:
        if not user_id:
            return False

        now = time.time()
        if now - self._last_prune > 60:
            self._prune(now)
            self._last_prune = now

        timestamps = self.api_spikes.setdefault(user_id, [])
        timestamps.append(now)
        # Check if >= 100 requests in 10 seconds (DDoS/Spam)
        recent = [t for t in timestamps if now - t <= 10]
        self.api_spikes[user_id] = recent
        return len(recent) >= 100

    def _prune(self, now: float):
        inactive_ips = [ip for ip, h in self.failed_logins.items() if not h or (now - h[-1] > 120)]
        for ip in inactive_ips:
            del self.failed_logins[ip]

        inactive_users = [u for u, h in self.api_spikes.items() if not h or (now - h[-1] > 30)]
        for u in inactive_users:
            del self.api_spikes[u]
