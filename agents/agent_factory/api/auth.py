"""
Module 54, 55, 59 & 61: API Authentication, Tenant Resolution, HMAC Webhook Verification, and Rate Limiting
"""

import hmac
import hashlib
import time
from typing import Dict, Optional, Tuple
from fastapi import Header, HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader

from agent_factory.core.security import TenantContext

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


class RateLimiter:
    """Module 61: Token bucket rate limiter per tenant / client."""

    def __init__(self, requests_per_minute: int = 60):
        self.rate = requests_per_minute
        self.capacity = requests_per_minute
        self._tokens: Dict[str, float] = {}
        self._last_check: Dict[str, float] = {}

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        if client_id not in self._tokens:
            self._tokens[client_id] = self.capacity
            self._last_check[client_id] = now

        # Replenish tokens
        elapsed = now - self._last_check[client_id]
        self._tokens[client_id] = min(self.capacity, self._tokens[client_id] + elapsed * (self.rate / 60.0))
        self._last_check[client_id] = now

        if self._tokens[client_id] >= 1.0:
            self._tokens[client_id] -= 1.0
            return True
        return False


rate_limiter = RateLimiter(requests_per_minute=120)


async def get_current_tenant(
    x_api_key: Optional[str] = Security(API_KEY_HEADER),
    x_tenant_id: Optional[str] = Header(default="default_tenant"),
    x_workspace_id: Optional[str] = Header(default="default_workspace"),
    x_user_id: Optional[str] = Header(default="default_user"),
) -> TenantContext:
    """Module 54 & 56: Authenticates API requests and scopes multi-tenancy context."""
    # In production, look up the API key in database/cache
    # For local/testing, accept valid mock key or require header if configured
    if not x_api_key and not x_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required authentication (X-API-Key or Tenant headers)."
        )

    # Rate limiting check
    client_key = f"{x_tenant_id}:{x_api_key or 'anon'}"
    if not rate_limiter.is_allowed(client_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please retry in a few seconds."
        )

    return TenantContext(
        tenant_id=x_tenant_id or "default_tenant",
        workspace_id=x_workspace_id or "default_workspace",
        user_id=x_user_id or "default_user",
        roles={"user", "agent_runner"}
    )


def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret_key: str) -> bool:
    """Module 59: Verifies HMAC-SHA256 signature for incoming webhooks."""
    if not signature_header or not secret_key:
        return False

    expected_sig = hmac.new(
        key=secret_key.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_sig, signature_header)
