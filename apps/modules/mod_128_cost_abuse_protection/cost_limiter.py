from typing import Dict

class CostAbuseLimiter:
    DAILY_BUDGET_USD = 100.0

    def __init__(self):
        self._user_spend: Dict[str, float] = {}

    def record_spend(self, user_id: str, cost_usd: float) -> bool:
        curr = self._user_spend.get(user_id, 0.0) + cost_usd
        self._user_spend[user_id] = curr
        return curr <= self.DAILY_BUDGET_USD
