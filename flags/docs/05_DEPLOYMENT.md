# 05 — Feature Flags Deployment Guide

## 1. Database Setup
- Execute `001_initial_flags_schema.sql` to set up flag definitions and audit tables.
- Seed bootstrap kill switches for critical integrations (payments, AI, emails).
