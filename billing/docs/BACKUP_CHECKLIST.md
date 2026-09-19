# Module 02: Database Backup & Financial Audit Trail Checklist

## 1. Objectives & Metrics
- **Recovery Point Objective (RPO)**: < 5 minutes (Financial data requires near-zero loss).
- **Recovery Time Objective (RTO)**: < 30 minutes.

---

## 2. Financial Immutability & Audit Trail
- [ ] **Immutable Invoices**: Verify that invoices and payment records are append-only.
- [ ] **Continuous WAL Archiving**: Enable PostgreSQL point-in-time recovery (PITR) with continuous archiving.
- [ ] **Dual-Source Reconciliation**: Run `FinancialReconciliationJob` daily to compare internal records against provider data.
