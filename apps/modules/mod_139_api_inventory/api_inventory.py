class ApiInventoryAuditor:
    @staticmethod
    def detect_shadow_apis(registered_routes: set, active_traffic_routes: set) -> set:
        # Shadow/zombie APIs: traffic hitting endpoints not in the registered OpenAPI catalog
        return active_traffic_routes - registered_routes
