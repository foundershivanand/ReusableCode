from typing import Dict, List

class MultiRegionFailoverController:
    def __init__(self, primary_region: str, backup_regions: List[str]):
        self.primary_region = primary_region
        self.backup_regions = backup_regions
        self.region_health: Dict[str, bool] = {primary_region: True}
        for r in backup_regions:
            self.region_health[r] = True

    def set_region_health(self, region: str, is_healthy: bool):
        self.region_health[region] = is_healthy

    def get_active_routing_region(self) -> str:
        if self.region_health.get(self.primary_region, False):
            return self.primary_region
        for r in self.backup_regions:
            if self.region_health.get(r, False):
                return r
        return self.primary_region # Degraded fallback
