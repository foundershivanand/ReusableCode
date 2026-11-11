class AutoScalingPolicyEngine:
    def __init__(self, min_pods: int = 2, max_pods: int = 50, target_cpu_pct: float = 70.0):
        self.min_pods = min_pods
        self.max_pods = max_pods
        self.target_cpu = target_cpu_pct

    def compute_desired_replicas(self, current_pods: int, current_cpu_pct: float, current_rps: float) -> int:
        if current_cpu_pct <= 0:
            return self.min_pods
        scale_factor = current_cpu_pct / self.target_cpu
        desired = int(current_pods * scale_factor)
        # Check RPS pressure: e.g. > 200 RPS per pod triggers scale out
        rps_per_pod = current_rps / max(current_pods, 1)
        if rps_per_pod > 200:
            desired = max(desired, int(current_rps / 200) + 1)
        return max(self.min_pods, min(self.max_pods, desired))
