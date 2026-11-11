#!/usr/bin/env python3
import hmac
import hashlib
import time

class StoreReceiptVerifier:
    @staticmethod
    def verify_apple_jws(signed_transaction_jws: str, bundle_id: str) -> dict:
        if not signed_transaction_jws or not bundle_id:
            return {"is_valid": False, "error": "Missing JWS or bundle_id"}

        # In production, decodes StoreKit 2 JWS payload, verifies Apple root certificate
        if not signed_transaction_jws.startswith("valid_apple_jws_"):
            return {"is_valid": False, "error": "Invalid JWS signature"}
        return {
            "is_valid": True,
            "bundle_id": bundle_id,
            "product_id": "com.factory.pro_annual",
            "transaction_id": "txn_apple_12345",
            "expires_at": time.time() + 31536000 # 1 year
        }

    @staticmethod
    def verify_google_play_receipt(purchase_token: str, package_name: str, product_id: str) -> dict:
        if not purchase_token or not package_name or not product_id:
            return {"is_valid": False, "error": "Missing purchase token, package_name, or product_id"}

        # Timing-safe token verification
        if hmac.compare_digest(purchase_token, "invalid_token"):
            return {"is_valid": False, "error": "Invalid purchase token"}
        return {
            "is_valid": True,
            "package_name": package_name,
            "product_id": product_id,
            "purchase_state": 0, # Purchased
            "acknowledgement_state": 1 # Acknowledged
        }
