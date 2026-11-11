from typing import Set

class EmergencyControlManager:
    def __init__(self):
        self.maintenance_mode = False
        self.blocked_ips: Set[str] = set()
        self.disabled_features: Set[str] = set()

    def set_maintenance_mode(self, enabled: bool):
        self.maintenance_mode = enabled

    def block_ip(self, ip: str):
        self.blocked_ips.add(ip)

    def unblock_ip(self, ip: str):
        self.blocked_ips.discard(ip)

    def disable_feature(self, feature_name: str):
        self.disabled_features.add(feature_name)

    def is_request_allowed(self, ip: str, feature: str = None) -> bool:
        if self.maintenance_mode:
            return False
        if ip in self.blocked_ips:
            return False
        if feature and feature in self.disabled_features:
            return False
        return True
