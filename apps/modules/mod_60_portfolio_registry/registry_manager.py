from typing import Dict, Optional

class PortfolioRegistryManager:
    """Central registry maintaining identity, repository, bundle ID, and health for all factory apps."""

    def __init__(self):
        self._apps: Dict[str, dict] = {}

    def register_app(self, app_id: str, name: str, bundle_id: str, backend_url: str):
        self._apps[app_id] = {
            "app_id": app_id,
            "name": name,
            "bundle_id": bundle_id,
            "backend_url": backend_url,
            "status": "ACTIVE"
        }

    def get_app(self, app_id: str) -> Optional[dict]:
        return self._apps.get(app_id)

    def list_apps(self) -> Dict[str, dict]:
        return self._apps.copy()
