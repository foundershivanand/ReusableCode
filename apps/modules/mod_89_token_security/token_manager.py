#!/usr/bin/env python3
import time

class TokenFamily:
    def __init__(self, family_id: str):
        self.family_id = family_id
        self.active_refresh_token = "rt_initial"
        self.is_compromised = False

    def rotate(self, presented_token: str, new_token: str) -> bool:
        if self.is_compromised:
            return False
        if presented_token != self.active_refresh_token:
            # Token reuse detected! Revoke whole family
            self.is_compromised = True
            return False
        self.active_refresh_token = new_token
        return True
