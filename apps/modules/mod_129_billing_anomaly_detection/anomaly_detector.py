import statistics
from typing import List

class BillingAnomalyDetector:
    @staticmethod
    def is_spike(recent_hourly_costs: List[float], candidate_cost: float, z_threshold: float = 3.0) -> bool:
        if len(recent_hourly_costs) < 5:
            return False
        mean = statistics.mean(recent_hourly_costs)
        stdev = statistics.stdev(recent_hourly_costs)
        if stdev == 0:
            return candidate_cost > mean * 2.0
        z_score = (candidate_cost - mean) / stdev
        return z_score >= z_threshold
