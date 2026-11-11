class EdgeSecurityHeaders:
    STANDARD_HEADERS = {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none';"
    }

    @classmethod
    def get_headers(cls) -> dict:
        return cls.STANDARD_HEADERS.copy()
