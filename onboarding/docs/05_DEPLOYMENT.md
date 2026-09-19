# 05 — Onboarding Deployment Guide

## 1. Database Migrations
- Apply `001_initial_onboarding_schema.sql` using the standard migration pipeline.
- Verify indexes on `user_id` and `tenant_id`.

## 2. Seeding Default Flows
- Run the seed script during deployment to register default onboarding steps: Account Setup, Profile Completion, First Project, Invite Teammates.
