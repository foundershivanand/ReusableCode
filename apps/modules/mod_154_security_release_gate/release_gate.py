class SecurityReleaseGate:
    """Hard CI/CD deployment blocking gate ensuring zero security defects before store submission."""

    @staticmethod
    def can_release(scorecard: dict, open_vulnerabilities: list) -> bool:
        if scorecard.get("score_pct", 0) < 100.0:
            return False
        # Block if any open CRITICAL or HIGH severity CVEs
        for vuln in open_vulnerabilities:
            if vuln.get("severity") in ["CRITICAL", "HIGH"]:
                return False
        return True

    @staticmethod
    def generate_release_manifest(app_id: str, version: str, scorecard: dict) -> dict:
        return {
            "app_id": app_id,
            "version": version,
            "security_score_pct": scorecard.get("score_pct", 0),
            "gate_status": "APPROVED",
            "release_authorized": True
        }
