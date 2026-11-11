class DdosResilienceRules:
    RATE_LIMITS = {
        "global_per_ip_rps": 100,
        "login_per_ip_rps": 5,
        "search_per_ip_rps": 10
    }

    @classmethod
    def get_firewall_rules(cls) -> dict:
        return cls.RATE_LIMITS
