class CloudIamPolicyAuditor:
    @staticmethod
    def audit_policy(policy_doc: dict) -> list:
        findings = []
        for statement in policy_doc.get("Statement", []):
            if statement.get("Effect") == "Allow":
                actions = statement.get("Action", [])
                if "*" in actions or "s3:*" in actions:
                    findings.append("Wildcard permissions violate least privilege")
        return findings
