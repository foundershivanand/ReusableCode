#!/usr/bin/env python3
import plistlib
import os

class IosSecurityVerifier:
    @staticmethod
    def verify_info_plist(plist_path: str) -> dict:
        if not os.path.exists(plist_path):
            return {"valid": False, "error": "File not found"}
        with open(plist_path, "rb") as f:
            data = plistlib.load(f)
        
        ats = data.get("NSAppTransportSecurity", {})
        allows_arbitrary = ats.get("NSAllowsArbitraryLoads", True)
        
        return {
            "valid": True,
            "ats_hardened": allows_arbitrary is False,
            "has_encryption_exemption": "ITSAppUsesNonExemptEncryption" in data
        }
