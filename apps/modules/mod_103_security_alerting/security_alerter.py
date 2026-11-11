#!/usr/bin/env python3
class SecurityAlerter:
    @staticmethod
    def format_alert(title: str, severity: str, details: str) -> dict:
        return {
            "title": f"[{severity.upper()}] {title}",
            "severity": severity,
            "details": details,
            "requires_action": severity in ["CRITICAL", "HIGH"]
        }
