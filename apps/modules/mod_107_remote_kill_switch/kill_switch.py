from typing import Dict, Set

class RemoteKillSwitch:
    def __init__(self):
        self.killed_endpoints: Set[str] = set()
        self.killed_app_versions: Set[str] = set()

    def kill_endpoint(self, endpoint: str):
        self.killed_endpoints.add(endpoint)

    def kill_version(self, version: str):
        self.killed_app_versions.add(version)

    def is_endpoint_killed(self, endpoint: str) -> bool:
        return endpoint in self.killed_endpoints

    def is_version_killed(self, version: str) -> bool:
        return version in self.killed_app_versions
