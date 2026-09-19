# 01 — Affiliate & Referral System Architecture

## 1. Overview
The Referral module provides partner affiliate link attribution (`?ref=CODE`), 60-day attribution windows, multi-signal fraud and self-referral defense, commission ledgering, and automatic refund reversals.

## 2. Commission State Machine
- `PENDING` → Commission calculated on successful customer payment.
- `APPROVED` → Passed fraud review and trial period (e.g. 30 days).
- `PAYABLE` → Scheduled for batch payout.
- `PAID` → Payout disbursed to partner.
- `REVERSED` → Triggered when customer transaction is refunded or disputed.
- `DISPUTED` → Flagged for manual operational review.
