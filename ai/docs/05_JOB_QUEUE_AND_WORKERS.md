# Module 10: AI Infrastructure - Job Queue and Workers

## Overview
Long-running AI workflows (batch document summarization, video transcription, embedding generation, large RAG indexing) cannot run within synchronous HTTP request windows. `AIJobQueue` provides a BullMQ-style background execution framework.

## Lifecycle & Status Transitions

```
[ Enqueue ]
     |
     v
  QUEUED ----(Worker Pick)----> PROCESSING ----(Success)----> COMPLETED
                                    |
                               (Failure)
                                    |
                                    v
                           Attempts < MaxAttempts?
                                  /       \
                             (Yes)         (No)
                              /             \
                             v               v
                          FAILED         DEAD_LETTER (DLQ)
```

## Features

### 1. Exponential Backoff with Jitter
When a worker encounters a transient error (e.g. LLM rate limit 429 or network timeout), the job fails and is rescheduled with backoff:
$$\text{delay} = \text{base} \times 2^{\text{attempts}} + \text{jitter}$$

### 2. Dead Letter Queue (DLQ)
If a job fails consecutively up to `maxAttempts` (default: 3), it is marked as `DEAD_LETTER`. DLQ jobs are preserved for administrative inspection, error triage, and manual replay.

### 3. Cooperative Cancellation
Clients can request cancellation via `queue.cancel(jobId)`. The worker receives an `AbortSignal` allowing long-running tasks or streaming generators to abort cleanly without leaking memory or tokens.

### 4. Progress Reporting
Workers periodically call `updateProgress(percentage: number)` which updates `ai_jobs.progress` (0 to 100). The client UI reflects progress in real time.

### 5. Idempotency Deduplication
Enqueuing jobs with an `idempotencyKey` guarantees that duplicate submissions (e.g. from network retries) return the existing job instance without creating redundant background work.
