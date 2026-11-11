import re

class CicdPipelineAuditor:
    FORBIDDEN_PATTERNS = [
        re.compile(r"curl\s+.*\s*\|\s*(ba)?sh"),
        re.compile(r"wget\s+.*\s*\|\s*(ba)?sh"),
        re.compile(r"uses:\s+actions/checkout@(main|master)")
    ]

    @classmethod
    def audit_workflow_yaml(cls, yaml_content: str) -> dict:
        violations = []
        for line in yaml_content.splitlines():
            for p in cls.FORBIDDEN_PATTERNS:
                if p.search(line):
                    violations.append(f"Unsafe CI/CD pattern detected: {line.strip()}")
        return {"is_compliant": len(violations) == 0, "violations": violations}
