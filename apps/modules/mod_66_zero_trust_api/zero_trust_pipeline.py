import time
from typing import Dict, Optional, Tuple

class ZeroTrustPipeline:
    @staticmethod
    def inspect_request(
        headers: Dict[str, str],
        client_ip: str,
        user_agent: str,
        device_fingerprint: str
    ) -> Tuple[bool, Optional[str]]:
        # 1. Reject cleartext/non-HTTPS
        if headers.get("x-forwarded-proto", "https").lower() != "https":
            return False, "Cleartext HTTP is forbidden under Zero Trust"

        # 2. Reject missing client identity tokens
        auth_header = headers.get("authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return False, "Missing or malformed Authorization bearer token"

        # 3. Check for mandatory request correlation
        if "x-correlation-id" not in headers:
            return False, "Missing mandatory X-Correlation-ID header"

        # 4. Enforce TLS 1.3 or TLS 1.2 minimum
        tls_ver = headers.get("x-tls-version", "TLSv1.3")
        if tls_ver in ["TLSv1.0", "TLSv1.1"]:
            return False, "Deprecated TLS version rejected"

        return True, None
