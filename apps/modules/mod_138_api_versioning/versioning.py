class ApiVersioningEngine:
    SUPPORTED_VERSIONS = {"v1", "v2"}
    SUNSET_VERSIONS = {"v0"}

    @classmethod
    def negotiate_version(cls, requested_version: str) -> dict:
        if requested_version in cls.SUNSET_VERSIONS:
            return {"status": "DEPRECATED", "sunset": True}
        if requested_version in cls.SUPPORTED_VERSIONS:
            return {"status": "ACTIVE", "sunset": False}
        return {"status": "UNSUPPORTED", "sunset": False}
