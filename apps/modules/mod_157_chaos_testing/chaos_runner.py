import time

class ChaosTestingRunner:
    @staticmethod
    def simulate_latency(target_ms: float):
        time.sleep(target_ms / 1000.0)

    @staticmethod
    def should_inject_fault(failure_rate: float = 0.05) -> bool:
        import random
        return random.random() < failure_rate
