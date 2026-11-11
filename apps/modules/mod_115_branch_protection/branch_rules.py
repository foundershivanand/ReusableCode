class BranchProtectionRules:
    @staticmethod
    def evaluate_branch_policy(branch_name: str, config: dict) -> dict:
        if branch_name in ["main", "master", "release"]:
            min_reviews = config.get("required_approving_review_count", 0)
            require_signed = config.get("required_signatures", False)
            return {
                "branch": branch_name,
                "is_protected": min_reviews >= 1 and require_signed,
                "requires_remediation": min_reviews < 1 or not require_signed
            }
        return {"branch": branch_name, "is_protected": True, "requires_remediation": False}
