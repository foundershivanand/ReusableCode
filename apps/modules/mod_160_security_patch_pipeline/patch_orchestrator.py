import time

class SecurityPatchPipeline:
    """Orchestrates zero-downtime hotfixes and security patches across the factory portfolio."""

    STAGES = ["BUILD", "STATIC_ANALYSIS", "CANARY_1_PCT", "CANARY_10_PCT", "FULL_ROLLOUT"]

    def __init__(self, patch_id: str, target_apps: list):
        self.patch_id = patch_id
        self.target_apps = target_apps
        self.current_stage = 0
        self.created_at = time.time()

    def advance_stage(self) -> str:
        if self.current_stage < len(self.STAGES) - 1:
            self.current_stage += 1
            return self.STAGES[self.current_stage]
        return "FULLY_DEPLOYED"

    def get_status(self) -> dict:
        return {
            "patch_id": self.patch_id,
            "stage": self.STAGES[self.current_stage],
            "apps_patched": len(self.target_apps),
            "healthy": True
        }
