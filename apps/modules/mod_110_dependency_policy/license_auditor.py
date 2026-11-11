from typing import List, Dict

class DependencyLicenseAuditor:
    PERMITTED_LICENSES = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC"}
    FORBIDDEN_LICENSES = {"GPL-2.0", "GPL-3.0", "AGPL-3.0"}

    @classmethod
    def audit_dependencies(cls, dependencies: List[Dict[str, str]]) -> dict:
        violations = []
        for dep in dependencies:
            lic = dep.get("license", "UNKNOWN")
            if lic in cls.FORBIDDEN_LICENSES:
                violations.append(f"Forbidden license {lic} in {dep.get('name')}")
        return {
            "is_compliant": len(violations) == 0,
            "violations": violations
        }
