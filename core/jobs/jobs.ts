import { generatePrefixedId } from "../ids/ids.js";
import { InternalError } from "../errors/errors.js";
import { logger } from "../observability/tracing.js";

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "RETRYING";

export interface RetryPolicy {
  maxAttempts: number;
  initialBackoffMs: number;
  backoffFactor: number;
  maxBackoffMs: number;
}

export interface JobDefinition<TPayload = any, TResult = any> {
  jobId: string;
  name: string;
  tenantId?: string;
  actorId?: string;
  requestId: string;
  idempotencyKey?: string;
  payload: TPayload;
  status: JobStatus;
  attempt: number;
  retryPolicy: RetryPolicy;
  timeoutMs: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: TResult;
}

export interface JobHandler<TPayload = any, TResult = any> {
  (payload: TPayload, job: JobDefinition<TPayload, TResult>): Promise<TResult>;
}

export class BackgroundJobQueue {
  private handlers = new Map<string, JobHandler<any, any>>();
  private jobs = new Map<string, JobDefinition<any, any>>();

  constructor(private maxRetainedJobs: number = 10_000) {}

  registerHandler<TPayload, TResult>(name: string, handler: JobHandler<TPayload, TResult>) {
    this.handlers.set(name, handler);
  }

  async enqueue<TPayload, TResult>(params: {
    name: string;
    payload: TPayload;
    tenantId?: string;
    actorId?: string;
    requestId?: string;
    idempotencyKey?: string;
    retryPolicy?: Partial<RetryPolicy>;
    timeoutMs?: number;
  }): Promise<JobDefinition<TPayload, TResult>> {
    // Check idempotency
    if (params.idempotencyKey) {
      for (const existing of this.jobs.values()) {
        if (existing.idempotencyKey === params.idempotencyKey) {
          return existing;
        }
      }
    }

    // Memory bounding: prune oldest completed/failed jobs if limit reached
    if (this.jobs.size >= this.maxRetainedJobs) {
      for (const [id, j] of this.jobs.entries()) {
        if (j.status === "COMPLETED" || j.status === "FAILED") {
          this.jobs.delete(id);
          if (this.jobs.size < this.maxRetainedJobs) break;
        }
      }
    }

    const job: JobDefinition<TPayload, TResult> = {
      jobId: generatePrefixedId("job"),
      name: params.name,
      tenantId: params.tenantId,
      actorId: params.actorId,
      requestId: params.requestId || generatePrefixedId("req"),
      idempotencyKey: params.idempotencyKey,
      payload: params.payload,
      status: "QUEUED",
      attempt: 0,
      retryPolicy: {
        maxAttempts: params.retryPolicy?.maxAttempts ?? 3,
        initialBackoffMs: params.retryPolicy?.initialBackoffMs ?? 100,
        backoffFactor: params.retryPolicy?.backoffFactor ?? 2,
        maxBackoffMs: params.retryPolicy?.maxBackoffMs ?? 5000,
      },
      timeoutMs: params.timeoutMs ?? 30000,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(job.jobId, job);
    return job;
  }

  async processJob(jobId: string): Promise<JobDefinition<any, any>> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new InternalError(`Job '${jobId}' not found`);
    }

    const handler = this.handlers.get(job.name);
    if (!handler) {
      throw new InternalError(`No registered handler for job '${job.name}'`);
    }

    job.attempt += 1;
    job.status = "RUNNING";
    job.startedAt = new Date().toISOString();

    try {
      // Execute with timeout
      const result = await Promise.race([
        handler(job.payload, job),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Job timed out after ${job.timeoutMs}ms`)), job.timeoutMs)
        ),
      ]);

      job.status = "COMPLETED";
      job.result = result;
      job.finishedAt = new Date().toISOString();
      return job;
    } catch (err: any) {
      logger.error(`Job '${job.jobId}' attempt ${job.attempt} failed: ${err.message}`);
      job.error = err.message;

      if (job.attempt < job.retryPolicy.maxAttempts) {
        job.status = "RETRYING";
        // Calculate backoff
        const backoff = Math.min(
          job.retryPolicy.initialBackoffMs * Math.pow(job.retryPolicy.backoffFactor, job.attempt - 1),
          job.retryPolicy.maxBackoffMs
        );
        logger.info(`Job '${job.jobId}' scheduled for retry in ${backoff}ms`);
      } else {
        job.status = "FAILED";
        job.finishedAt = new Date().toISOString();
      }

      return job;
    }
  }

  getJob(jobId: string): JobDefinition<any, any> | undefined {
    return this.jobs.get(jobId);
  }
}

export const defaultJobQueue = new BackgroundJobQueue();
