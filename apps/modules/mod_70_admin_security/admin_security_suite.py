#!/usr/bin/env python3
import time
import hmac
import hashlib
import struct
import base64
import os

class TotpMfaEngine:
    @staticmethod
    def generate_secret() -> str:
        return base64.b32encode(os.urandom(20)).decode('ascii')

    @staticmethod
    def generate_totp(secret_base32: str, time_step_sec: int = 30) -> str:
        if time_step_sec <= 0:
            raise ValueError("time_step_sec must be positive")
        try:
            key = base64.b32decode(secret_base32.upper(), casefold=True)
        except Exception:
            raise ValueError("Invalid base32 secret")

        counter = int(time.time() // time_step_sec)
        msg = struct.pack(">Q", counter)
        h = hmac.new(key, msg, hashlib.sha1).digest()
        offset = h[19] & 0x0F
        code = (struct.unpack(">I", h[offset:offset+4])[0] & 0x7FFFFFFF) % 1000000
        return f"{code:06d}"

    @classmethod
    def verify_totp(cls, secret_base32: str, candidate_code: str, window: int = 1) -> bool:
        if not candidate_code or len(candidate_code) != 6 or not candidate_code.isdigit():
            return False
        try:
            key = base64.b32decode(secret_base32.upper(), casefold=True)
        except Exception:
            return False

        current_counter = int(time.time() // 30)
        for offset in range(-window, window + 1):
            counter = current_counter + offset
            msg = struct.pack(">Q", counter)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            o = h[19] & 0x0F
            code = (struct.unpack(">I", h[o:o+4])[0] & 0x7FFFFFFF) % 1000000
            if hmac.compare_digest(f"{code:06d}", candidate_code):
                return True
        return False

class AdminSecurityGuard:
    CRITICAL_ACTIONS = {
        "drop_database", "bulk_refund", "change_pricing", "export_user_data", "rotate_master_key"
    }

    @classmethod
    def requires_step_up_reauth(cls, action: str) -> bool:
        return action in cls.CRITICAL_ACTIONS
