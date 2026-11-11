class PipelineGatekeeper:
    """Enforces rigorous code quality, formatting, and test coverage standards."""

    MIN_TEST_COVERAGE_PCT = 85.0

    @classmethod
    def evaluate_commit(cls, lint_passed: bool, test_coverage_pct: float, sast_clean: bool) -> dict:
        passed = lint_passed and test_coverage_pct >= cls.MIN_TEST_COVERAGE_PCT and sast_clean
        return {
            "passed": passed,
            "lint_passed": lint_passed,
            "coverage_ok": test_coverage_pct >= cls.MIN_TEST_COVERAGE_PCT,
            "sast_clean": sast_clean,
            "action": "MERGE_PERMITTED" if passed else "BLOCK_PR"
        }
