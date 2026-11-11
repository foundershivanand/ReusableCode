"""
Module 70: Regression Testing and Automated Benchmark Runner
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.evaluation.dataset import GoldenDataset, TestCase
from agent_factory.evaluation.judge import LLMAsJudge, JudgeScorecard


class CaseEvaluationReport(BaseModel):
    case_id: str
    passed: bool
    deterministic_passed: bool
    judge_passed: bool
    judge_scorecard: Optional[JudgeScorecard] = None
    errors: List[str] = Field(default_factory=list)
    output: str = ""


class BenchmarkReport(BaseModel):
    dataset_id: str
    agent_id: str
    total_cases: int
    passed_cases: int
    pass_rate: float
    average_judge_score: float
    case_reports: List[CaseEvaluationReport] = Field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.pass_rate >= 0.85


class RegressionRunner:
    """Module 70: Automated test harness for preventing performance regressions."""

    def __init__(self, judge: Optional[LLMAsJudge] = None):
        self.judge = judge

    async def evaluate_agent(
        self,
        agent_instance: Any,
        dataset: GoldenDataset,
        min_pass_rate: float = 0.85
    ) -> BenchmarkReport:
        reports: List[CaseEvaluationReport] = []
        total_judge_scores = 0.0
        judge_count = 0

        for case in dataset.test_cases:
            errors: List[str] = []
            det_passed = True

            # 1. Run agent
            try:
                result_output = await agent_instance.run(case.input_prompt)
            except Exception as e:
                result_output = ""
                errors.append(f"Agent execution raised exception: {e}")
                det_passed = False

            # 2. Deterministic checks
            output_lower = result_output.lower()
            for kw in case.expected_output_keywords:
                if kw.lower() not in output_lower:
                    errors.append(f"Missing expected keyword: '{kw}'")
                    det_passed = False

            for forbidden in case.forbidden_output_keywords:
                if forbidden.lower() in output_lower:
                    errors.append(f"Found forbidden keyword: '{forbidden}'")
                    det_passed = False

            # 3. LLM-as-Judge check
            judge_scorecard = None
            judge_passed = True
            if self.judge and result_output:
                judge_scorecard = await self.judge.evaluate_response(
                    case_id=case.case_id,
                    input_prompt=case.input_prompt,
                    agent_output=result_output,
                    criteria_notes=case.description
                )
                judge_passed = judge_scorecard.passed
                total_judge_scores += judge_scorecard.overall_score
                judge_count += 1
                if not judge_passed:
                    errors.append(f"Judge critique: {judge_scorecard.critique}")

            overall_case_passed = det_passed and judge_passed
            reports.append(
                CaseEvaluationReport(
                    case_id=case.case_id,
                    passed=overall_case_passed,
                    deterministic_passed=det_passed,
                    judge_passed=judge_passed,
                    judge_scorecard=judge_scorecard,
                    errors=errors,
                    output=result_output
                )
            )

        passed_count = sum(1 for r in reports if r.passed)
        total = len(reports)
        pass_rate = (passed_count / total) if total > 0 else 0.0
        avg_score = (total_judge_scores / judge_count) if judge_count > 0 else 0.0

        return BenchmarkReport(
            dataset_id=dataset.dataset_id,
            agent_id=getattr(agent_instance, "agent_id", "unknown"),
            total_cases=total,
            passed_cases=passed_count,
            pass_rate=round(pass_rate, 4),
            average_judge_score=round(avg_score, 2),
            case_reports=reports
        )
