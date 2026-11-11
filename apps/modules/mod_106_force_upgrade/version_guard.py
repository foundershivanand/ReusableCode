class VersionPolicyGuard:
    def __init__(self, min_supported_version: str, latest_version: str):
        self.min_supported = [int(x) for x in min_supported_version.split(".")]
        self.latest = [int(x) for x in latest_version.split(".")]

    def evaluate_client(self, client_version_str: str) -> dict:
        try:
            parts = [int(x) for x in client_version_str.split(".")]
        except Exception:
            return {"action": "FORCE_UPGRADE", "message": "Invalid version"}

        if parts < self.min_supported:
            return {
                "action": "FORCE_UPGRADE",
                "message": "This version is deprecated. Please update to continue using the app."
            }
        elif parts < self.latest:
            return {
                "action": "RECOMMEND_UPGRADE",
                "message": "A new version of the app is available with performance improvements."
            }
        return {"action": "ALLOW", "message": "Up to date"}
