#!/usr/bin/env python3
import time

class AdminSession:
    def __init__(self, admin_id: str, mfa_verified: bool):
        self.admin_id = admin_id
        self.mfa_verified = mfa_verified
        self.last_active = time.time()
        self.max_idle_seconds = 900 # 15 minutes

    def is_valid(self) -> bool:
        if not self.mfa_verified:
            return False
        return (time.time() - self.last_active) <= self.max_idle_seconds

    def touch(self):
        self.last_active = time.time()
