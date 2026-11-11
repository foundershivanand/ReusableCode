#!/usr/bin/env python3
import time

class RateLimitMatrix:
    LIMITS = {
        "login": (10, 600),       # 10 req / 10 min
        "ai_generation": (20, 60), # 20 req / 1 min
        "file_upload": (5, 60),    # 5 req / 1 min
        "password_reset": (3, 3600) # 3 req / 1 hr
    }

    def __init__(self):
        self.history = {}

    def is_allowed(self, endpoint_type: str, client_key: str) -> bool:
        max_req, window_sec = self.LIMITS.get(endpoint_type, (60, 60))
        now = time.time()
        bucket_key = f"{endpoint_type}:{client_key}"
        timestamps = self.history.get(bucket_key, [])
        valid_ts = [t for t in timestamps if now - t < window_sec]

        if len(valid_ts) >= max_req:
            return False
        valid_ts.append(now)
        self.history[bucket_key] = valid_ts
        return True
