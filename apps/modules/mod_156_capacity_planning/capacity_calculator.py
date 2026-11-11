class CapacityCalculator:
    @staticmethod
    def estimate_infra_needs(mau: int = 1000000) -> dict:
        dau = int(mau * 0.25)
        # Average user data footprint: 2 MB
        storage_gb = (mau * 2.0) / 1024.0
        min_pods = max(2, int(dau / 150000) + 1)
        return {
            "estimated_dau": dau,
            "estimated_storage_gb": round(storage_gb, 1),
            "recommended_min_api_pods": min_pods
        }
