class NetworkSegmentationRules:
    @staticmethod
    def is_communication_allowed(source_tier: str, target_tier: str) -> bool:
        allowed = {
            ("public_edge", "api_gateway"): True,
            ("api_gateway", "app_service"): True,
            ("app_service", "database"): True,
            ("public_edge", "database"): False # Never direct edge to DB!
        }
        return allowed.get((source_tier, target_tier), False)
