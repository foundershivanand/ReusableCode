# 05 — Audit Logs Deployment Guide

## 1. Database Migrations
- Execute `001_initial_audit_schema.sql`.
- PostgreSQL rules prevent standard `UPDATE` and `DELETE` queries on the table.
