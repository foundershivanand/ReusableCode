class FactoryMetricsAggregator:
    @staticmethod
    def calculate_kpis(dau: int, mau: int, monthly_revenue_usd: float) -> dict:
        stickiness = (dau / max(mau, 1)) * 100.0
        arpu = monthly_revenue_usd / max(mau, 1)
        return {
            "dau": dau,
            "mau": mau,
            "stickiness_pct": round(stickiness, 2),
            "arpu_usd": round(arpu, 2)
        }
