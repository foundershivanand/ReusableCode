import os

class SecureBuildEnvValidator:
    REQUIRED_VARS = ["CI", "RUNNER_OS"]
    DANGEROUS_VARS = ["DEBUG_SECRETS", "ENABLE_INSECURE_DEBUG"]

    @classmethod
    def validate_environment(cls) -> dict:
        findings = []
        for d in cls.DANGEROUS_VARS:
            if os.getenv(d):
                findings.append(f"Dangerous environment variable set: {d}")
        return {
            "is_secure": len(findings) == 0,
            "findings": findings
        }
