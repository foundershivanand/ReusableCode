# 01 — Export, Import & Data Portability Architecture

## 1. Overview
The Data Portability module manages large-scale asynchronous data exports (CSV, JSON, PDF) and multi-step import pipelines with schema validation, dry-run preview, duplicate detection, and rollback support.

## 2. Import Pipeline Lifecycle
1. **Upload & Parse**: Ingests raw CSV or JSON payloads.
2. **Schema & Reference Validation**: Verifies field constraints, enum values, and foreign keys.
3. **Duplicate Detection**: Identifies within-payload duplicates and conflicts with existing records.
4. **Dry Run**: Renders validation errors without mutating the database.
5. **Atomic Commit or Partial Ingestion**: Executes `ALL_OR_NOTHING` or `PARTIAL_WITH_ERRORS`.
