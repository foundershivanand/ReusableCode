#!/usr/bin/env python3
class DatabaseSecurityConfig:
    MAX_QUERY_TIMEOUT_MS = 5000
    ENFORCE_SSL = True
    CONNECTION_POOL_MAX = 20

    @classmethod
    def validate_connection_string(cls, uri: str) -> bool:
        if "sslmode=require" not in uri and "sslmode=verify-full" not in uri:
            return False
        return True
