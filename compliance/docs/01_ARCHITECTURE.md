# 01 — Legal & Compliance Layer Architecture

## 1. Overview
The Compliance module provides a jurisdiction-aware legal consent, policy versioning, data subject rights (GDPR / CCPA DSRs), retention management, and vendor processing inventory framework.

## 2. Consent Separation & Evidence Integrity
- Consent is NEVER bundled into a single boolean. Terms acceptance, privacy acknowledgement, marketing communications, and cookie categories are separated.
- Each consent record generates an immutable SHA-256 cryptographic hash evidence string capturing IP, timestamp, user ID, and policy versions.
