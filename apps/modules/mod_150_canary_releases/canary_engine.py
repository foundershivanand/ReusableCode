#!/usr/bin/env python3
class ProductionCanaryController:
    ROLLOUT_STAGES = [1, 5, 25, 50, 100] # Percentages
    MAX_PERMITTED_ERROR_RATE_PCT = 0.5   # 0.5% max

    def __init__(self):
        self.current_stage_idx = 0

    @property
    def current_percentage(self) -> int:
        return self.ROLLOUT_STAGES[self.current_stage_idx]

    def evaluate_step(self, error_rate_pct: float) -> str:
        if error_rate_pct > self.MAX_PERMITTED_ERROR_RATE_PCT:
            return "TRIGGER_ROLLBACK"
        if self.current_stage_idx < len(self.ROLLOUT_STAGES) - 1:
            self.current_stage_idx += 1
            return f"ADVANCE_TO_{self.current_percentage}%"
        return "FULLY_ROLLED_OUT"
