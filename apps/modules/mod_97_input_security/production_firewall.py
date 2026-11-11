#!/usr/bin/env python3
import re
import html

class ProductionInputFirewall:
    SQLI_REGEX = re.compile(r"(?i)(--|;|\/\*|\*\/| (UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|XP_) )")
    PATH_TRAVERSAL = re.compile(r"(\.\./|\.\.\\)")
    PROMPT_INJECTION = re.compile(r"(?i)(ignore\s+previous\s+instructions|system\s+prompt|developer\s+mode|jailbreak|bypass\s+safety)")
    XSS_REGEX = re.compile(r"(?i)(<script|javascript:|onerror\s*=|onload\s*=|data:text/html)")

    MAX_SAFE_INPUT_LEN = 50000

    @classmethod
    def audit_string(cls, input_str: str) -> dict:
        if not input_str:
            return {"is_safe": True, "findings": [], "escaped_html": ""}

        # 1. Null byte detection
        if "\x00" in input_str:
            return {
                "is_safe": False,
                "findings": ["NULL_BYTE_DETECTED"],
                "escaped_html": html.escape(input_str.replace("\x00", ""))
            }

        # 2. Input length bound (ReDoS prevention)
        if len(input_str) > cls.MAX_SAFE_INPUT_LEN:
            return {
                "is_safe": False,
                "findings": ["INPUT_LENGTH_EXCEEDED"],
                "escaped_html": html.escape(input_str[:1000])
            }

        findings = []
        if cls.SQLI_REGEX.search(input_str):
            findings.append("SQLI_DETECTED")
        if cls.PATH_TRAVERSAL.search(input_str):
            findings.append("PATH_TRAVERSAL_DETECTED")
        if cls.PROMPT_INJECTION.search(input_str):
            findings.append("PROMPT_INJECTION_DETECTED")
        if cls.XSS_REGEX.search(input_str):
            findings.append("XSS_DETECTED")

        return {
            "is_safe": len(findings) == 0,
            "findings": findings,
            "escaped_html": html.escape(input_str)
        }

    @classmethod
    def inspect_input(cls, input_str: str):
        audit = cls.audit_string(input_str)
        if audit["is_safe"]:
            return True, "SAFE"
        return False, f"THREAT_DETECTED: {','.join(audit['findings'])}"
