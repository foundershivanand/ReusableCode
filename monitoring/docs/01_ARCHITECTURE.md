# Architecture: Product Health, Monitoring & Incident System

## Overview
The Monitoring module provides real-time service health probing, Kubernetes-style liveness and readiness endpoints, alert deduplication, incident lifecycle management, and public status pages.

## Core Capabilities
1. **Health Endpoints**:
   - `/live`: Liveness probe. Confirms process and event loop are responsive.
   - `/ready`: Readiness probe. Confirms critical dependencies (PostgreSQL, Redis, RabbitMQ) are reachable to accept user traffic.
   - `/health`: Comprehensive breakdown of all dependencies with latency and error status.
2. **Alert Deduplication & Grouping**:
   - Computes unique fingerprints based on component and error type.
   - Cooldown suppression prevents alert storms during major outages.
3. **Incident Lifecycle**:
   - `DETECTED` -> `ACKNOWLEDGED` -> `INVESTIGATING` -> `MITIGATED` -> `RESOLVED` -> `POSTMORTEM`.
   - Chronological incident updates and postmortem tracking.
4. **SLO/SLA Tracking**:
   - Measurable targets (e.g. 99.9% uptime, <100ms API latency) with real-time `MET`, `AT_RISK`, `BREACHED` statuses.
