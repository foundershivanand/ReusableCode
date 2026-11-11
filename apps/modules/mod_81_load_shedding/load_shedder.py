class LoadShedder:
    PRIORITY_LEVELS = {"CRITICAL": 3, "HIGH": 2, "STANDARD": 1, "BACKGROUND": 0, "LOW": 0}

    def __init__(self, cpu_threshold_pct: float = 85.0):
        self.cpu_threshold = cpu_threshold_pct

    @classmethod
    def is_operation_permitted(cls, priority: str, current_cpu_pct: float) -> bool:
        p_val = cls.PRIORITY_LEVELS.get(priority.upper(), 1)
        if current_cpu_pct >= 95.0:
            return p_val >= 3 # Only CRITICAL permitted
        elif current_cpu_pct >= 85.0:
            return p_val >= 2 # HIGH and CRITICAL permitted
        elif current_cpu_pct >= 75.0:
            return p_val >= 1 # STANDARD, HIGH, CRITICAL permitted
        return True

    def should_shed(self, current_cpu_pct: float, priority: str) -> bool:
        return not self.is_operation_permitted(priority, current_cpu_pct)
