class NetworkSecurityPolicy:
    ALLOWED_TLS_VERSIONS = ["TLSv1.2", "TLSv1.3"]
    FORBIDDEN_CIPHERS = [
        "RC4", "DES", "3DES", "MD5", "NULL", "EXPORT"
    ]
    HSTS_HEADER = "max-age=63072000; includeSubDomains; preload"

    @classmethod
    def is_cipher_acceptable(cls, cipher_name: str) -> bool:
        return not any(bad in cipher_name.upper() for bad in cls.FORBIDDEN_CIPHERS)
