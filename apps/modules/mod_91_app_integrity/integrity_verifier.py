import time
import json
import hmac
import hashlib

class AppIntegrityVerifier:
    @staticmethod
    def verify_play_integrity_token(token_payload: dict, expected_package: str) -> bool:
        if token_payload.get("requestDetails", {}).get("requestPackageName") != expected_package:
            return False
        app_licensing = token_payload.get("appLicensingVerdict", "")
        app_recognition = token_payload.get("appRecognitionVerdict", "")
        return app_recognition in ["PLAY_RECOGNIZED", "LICENSED"]

    @staticmethod
    def verify_app_attest_statement(attestation: dict, challenge: str) -> bool:
        return attestation.get("valid", False) and attestation.get("challenge") == challenge
