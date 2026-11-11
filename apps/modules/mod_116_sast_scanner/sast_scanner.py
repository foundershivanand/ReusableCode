import re
from typing import List, Dict

class SastSecurityScanner:
    RULES = [
        {"id": "HARDCODED_SECRET", "pattern": re.compile(r"(?i)(password|secret|apikey)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]"), "severity": "HIGH"},
        {"id": "EVAL_USAGE", "pattern": re.compile(r"eval\s*\("), "severity": "CRITICAL"},
        {"id": "INSECURE_RANDOM", "pattern": re.compile(r"random\.random\(\)"), "severity": "MEDIUM"}
    ]

    @classmethod
    def scan_code(cls, source_code: str) -> List[dict]:
        findings = []
        for rule in cls.RULES:
            if rule["pattern"].search(source_code):
                findings.append({"rule_id": rule["id"], "severity": rule["severity"]})
        return findings
