#!/usr/bin/env python3
class IncidentPlaybook:
    PHASES = [
        "1_DETECT", "2_VERIFY", "3_CONTAIN", "4_ERADICATE",
        "5_RECOVER", "6_ROTATE_SECRETS", "7_PATCH", "8_POST_MORTEM"
    ]

    @classmethod
    def get_phase_checklist(cls, phase: str) -> list:
        checklists = {
            "3_CONTAIN": [
                "Isolate affected server/container",
                "Revoke affected user sessions",
                "Disable compromised API keys",
                "Block malicious IP ranges at WAF"
            ],
            "6_ROTATE_SECRETS": [
                "Rotate database master password",
                "Rotate payment gateway webhook secrets",
                "Invalidate all active refresh tokens"
            ]
        }
        return checklists.get(phase, ["Execute standard operating procedure"])
