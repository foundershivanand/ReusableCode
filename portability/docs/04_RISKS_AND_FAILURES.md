# 04 — Data Portability Risks and Failure Modes

## 1. Partial Failure Strategies
- Operators can choose `ALL_OR_NOTHING` for atomic database transactions or `PARTIAL_WITH_ERRORS` to import valid records and generate a row-by-row error report.
