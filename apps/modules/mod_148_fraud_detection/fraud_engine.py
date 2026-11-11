from typing import Dict

class FraudDetectionEngine:
    @staticmethod
    def calculate_risk_score(transaction: dict) -> dict:
        score = 0
        reasons = []

        if transaction.get("amount", 0) > 2000:
            score += 30
            reasons.append("HIGH_AMOUNT")
        if transaction.get("is_new_device", False):
            score += 25
            reasons.append("NEW_DEVICE")
        if transaction.get("card_country") != transaction.get("ip_country"):
            score += 35
            reasons.append("GEO_MISMATCH")

        action = "ALLOW"
        if score >= 70:
            action = "BLOCK"
        elif score >= 40:
            action = "STEP_UP_AUTH"

        return {"risk_score": score, "action": action, "reasons": reasons}
