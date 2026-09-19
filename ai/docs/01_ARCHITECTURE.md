# Module 10: AI Infrastructure - Architecture

## Overview
Module 10 (`ai/`) provides an enterprise-grade, multi-tenant AI infrastructure layer designed for massive scalability (100 to 1,000,000+ users). It decouples LLM provider integrations from business logic while enforcing strict prompt isolation, tool-call authorization, token/cost ledger accounting, and asynchronous background job queuing.

## Core Pillars

```
+-------------------------------------------------------------------------+
|                              Client Layer                                |
|   - AIChat Component (Prompt Isolation UI)                              |
|   - AIUsageCard (Real-time Budget & Kill Switch UI)                     |
|   - BackgroundJobList (Progress & DLQ UI)                               |
|   - useAIChat / useAIUsage / useAIJob Hooks                             |
|   - AIClient SDK (SSE Streaming, REST)                                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                               Server Layer                               |
|                                                                         |
|   +-----------------------+     +-----------------------------------+   |
|   |       AIService       | <-> |          AIJobQueue               |   |
|   | - Prompt Sanitization |     | - BullMQ-Style Worker Pool        |   |
|   | - Role Containment    |     | - Exponential Backoff + Jitter    |   |
|   | - Tool Authorization  |     | - Dead Letter Queue (DLQ)         |   |
|   | - Budget Kill Switch  |     | - Cooperative Cancellation        |   |
|   | - Multi-LLM Failover  |     | - Idempotency Deduplication       |   |
|   +-----------------------+     +-----------------------------------+   |
|               |                                                         |
|               +-----------------------+                                 |
|                                       v                                 |
|                         +---------------------------+                   |
|                         |    IAIRepository          |                   |
|                         | - Token Usage Ledger      |                   |
|                         | - Budget Store            |                   |
|                         | - Tool Execution Audit    |                   |
|                         | - Background Jobs DB      |                   |
|                         +---------------------------+                   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                             Provider Layer                               |
|   - OpenAI Adapter (GPT-4o, GPT-4o-mini, Embeddings)                    |
|   - Anthropic Adapter (Claude 3.5 Sonnet, Claude 3 Haiku)               |
|   - Google Adapter (Gemini 1.5 Pro, Gemini 1.5 Flash)                   |
|   - Mock AI Provider (Deterministic unit testing & CI/CD)               |
+-------------------------------------------------------------------------+
```

## Architectural Principles
1. **Zero Cross-Module Coupling**: AI has no compile-time or runtime dependencies on other modules. User identities, tenant IDs, and permission lists are passed via standard security contexts.
2. **Strict Prompt Role Isolation**: Messages are strongly categorized (`SYSTEM`, `DEVELOPER`, `TRUSTED_CONTEXT`, `UNTRUSTED_USER`, `RETRIEVED_CONTEXT`, `TOOL_OUTPUT`) to prevent prompt injection and instruction hijacking.
3. **Hard Cost & Budget Enforcement**: Token usage is measured and stored in micro-cents ($0.000001 resolution). If a tenant exceeds their daily or monthly budget, an automated kill switch terminates further LLM dispatches.
4. **Resilient Background Execution**: Long-running AI operations (e.g. document summarization, batch embeddings, fine-tuning) execute asynchronously via a BullMQ-style job queue with automatic retries and DLQ routing.
