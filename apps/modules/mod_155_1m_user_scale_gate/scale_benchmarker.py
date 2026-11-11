class ScaleBenchmarker:
    @staticmethod
    def calculate_peak_load(dau: int = 250000, requests_per_user_day: int = 35) -> dict:
        daily_reqs = dau * requests_per_user_day
        avg_rps = daily_reqs / 86400.0
        peak_rps = avg_rps * 3.5 # Standard 3.5x peak burst factor
        return {
            "dau": dau,
            "daily_requests": daily_reqs,
            "avg_rps": round(avg_rps, 1),
            "peak_rps": round(peak_rps, 1)
        }
