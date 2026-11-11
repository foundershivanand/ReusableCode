#!/usr/bin/env python3
import time
import hmac
import hashlib
import json
import base64
import secrets
from typing import Dict, Optional, Tuple

class JwtTokenManager:
    def __init__(self, hmac_secret: str, access_ttl_sec: int = 900, refresh_ttl_sec: int = 2592000):
        self.secret = hmac_secret.encode()
        self.access_ttl = access_ttl_sec   # 15 minutes
        self.refresh_ttl = refresh_ttl_sec # 30 days
        self.revoked_tokens: Dict[str, float] = {} # token -> exp_timestamp
        self.token_families = {} # family_id -> active_refresh_token
        self._last_prune = time.time()

    def _base64url_encode(self, data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

    def _base64url_decode(self, string: str) -> bytes:
        rem = len(string) % 4
        if rem > 0:
            string += '=' * (4 - rem)
        return base64.urlsafe_b64decode(string)

    def issue_token_pair(self, user_id: str, role: str, family_id: Optional[str] = None) -> Tuple[str, str]:
        now = int(time.time())
        family = family_id or f"fam_{secrets.token_hex(8)}"

        # 1. Issue Access Token with unique jti
        access_payload = {
            "sub": user_id,
            "role": role,
            "jti": secrets.token_hex(16),
            "iat": now,
            "exp": now + self.access_ttl,
            "type": "access"
        }
        access_token = self._sign_jwt(access_payload)

        # 2. Issue Refresh Token with unique jti
        refresh_payload = {
            "sub": user_id,
            "fam": family,
            "jti": secrets.token_hex(16),
            "iat": now,
            "exp": now + self.refresh_ttl,
            "type": "refresh"
        }
        refresh_token = self._sign_jwt(refresh_payload)

        self.token_families[family] = refresh_token
        return access_token, refresh_token

    def _sign_jwt(self, payload: dict) -> str:
        header = {"alg": "HS256", "typ": "JWT"}
        enc_header = self._base64url_encode(json.dumps(header).encode())
        enc_payload = self._base64url_encode(json.dumps(payload).encode())
        signing_input = f"{enc_header}.{enc_payload}"
        sig = hmac.new(self.secret, signing_input.encode(), hashlib.sha256).digest()
        enc_sig = self._base64url_encode(sig)
        return f"{signing_input}.{enc_sig}"

    def verify_token(self, token: str) -> Optional[dict]:
        if not token or token in self.revoked_tokens:
            return None
        parts = token.split('.')
        if len(parts) != 3:
            return None
        enc_header, enc_payload, enc_sig = parts
        signing_input = f"{enc_header}.{enc_payload}"
        expected_sig = self._base64url_encode(hmac.new(self.secret, signing_input.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(expected_sig, enc_sig):
            return None

        try:
            payload = json.loads(self._base64url_decode(enc_payload))
        except Exception:
            return None
        if payload.get("exp", 0) < time.time():
            return None # Expired
        return payload

    def rotate_refresh_token(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        if not refresh_token:
            return None

        now = time.time()
        if now - self._last_prune > 300:
            self._prune_expired_revocations(now)
            self._last_prune = now

        # Verify signature and structure directly to detect replay even for revoked tokens
        parts = refresh_token.split('.')
        if len(parts) != 3:
            return None
        enc_header, enc_payload, enc_sig = parts
        signing_input = f"{enc_header}.{enc_payload}"
        expected_sig = self._base64url_encode(hmac.new(self.secret, signing_input.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(expected_sig, enc_sig):
            return None

        try:
            payload = json.loads(self._base64url_decode(enc_payload))
        except Exception:
            return None

        exp = payload.get("exp", 0)
        if exp < time.time() or payload.get("type") != "refresh":
            return None

        family = payload.get("fam")
        user_id = payload.get("sub")
        active_token = self.token_families.get(family)

        # RFC 6819 Anti-Replay Detection:
        # If the token is already revoked or is NOT the currently active token for the family,
        # an attacker is replaying an old refresh token. Revoke the ENTIRE token family!
        if refresh_token in self.revoked_tokens or not active_token or active_token != refresh_token:
            self.token_families.pop(family, None)
            self.revoked_tokens[refresh_token] = exp
            return None

        # Valid rotation: mark old refresh token as revoked and issue fresh pair
        self.revoked_tokens[refresh_token] = exp
        return self.issue_token_pair(user_id=user_id, role="user", family_id=family)

    def _prune_expired_revocations(self, now: float):
        expired = [t for t, exp in self.revoked_tokens.items() if now > exp]
        for t in expired:
            del self.revoked_tokens[t]
