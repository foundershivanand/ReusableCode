# 01 — Customer Support, Live Chat & Feedback Architecture

## 1. Overview
The Customer Support module provides modular support ticketing, bug reporting, feature request collection, live chat adapters (Crisp, Intercom, Plain), and admin SLA lifecycle management.

## 2. Ticket State Machine & SLA Tracking
- `CREATED` → Initial ticket submission.
- `ASSIGNED` → Assigned to an agent.
- `FIRST_RESPONSE` → Agent sent first reply (`firstResponseAt` recorded).
- `PENDING_CUSTOMER` → Awaiting customer clarification.
- `RESOLVED` → Ticket marked resolved (`resolvedAt` recorded).
- `REOPENED` → Customer replies after resolution.
