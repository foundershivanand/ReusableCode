#!/usr/bin/env python3
class BranchProtection:
    POLICY = {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": True,
        "require_code_owner_reviews": True,
        "required_status_checks": ["test_and_lint", "sast_scan", "preflight_audit"],
        "enforce_admins": True,
        "require_signed_commits": True
    }
