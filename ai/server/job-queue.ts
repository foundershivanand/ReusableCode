import type { BackgroundJob } from "../schemas/index.js";
import type { IAIRepository } from "./repository.js";

export type JobHandler<R = any> = (
  job: BackgroundJob,
  updateProgress: (percentage: number) => Promise<void>,
  signal: AbortSignal
) => Promise<R>;

export interface EnqueueJobOptions {
  maxAttempts?: number;
  idempotencyKey?: string;
}

export class AIJobQueue {
  private handlers = new Map<string, JobHandler>();
  private abortControllers = new Map<string, AbortController>();
  private running = false;
  private pollIntervalMs: number;
  private timer?: NodeJS.Timeout;
  private concurrency: number;
  private activeCount = 0;

  constructor(
    private repository: IAIRepository,
    options: { pollIntervalMs?: number; concurrency?: number } = {}
  ) {
    this.pollIntervalMs = options.pollIntervalMs || 50;
    this.concurrency = options.concurrency || 5;
  }

  public registerWorker<R = any>(
    name: string,
    handler: JobHandler<R>
  ): void {
    this.handlers.set(name, handler);
  }


  public async enqueue<T = any>(
    name: string,
    tenantId: string,
    userId: string,
    payload: T,
    options: EnqueueJobOptions = {}
  ): Promise<BackgroundJob> {
    // Idempotency check
    if (options.idempotencyKey) {
      const existing = await this.repository.getJobByIdempotencyKey(
        tenantId,
        options.idempotencyKey
      );
      if (existing) {
        return existing;
      }
    }

    const job: BackgroundJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name,
      tenantId,
      userId,
      payload: payload as Record<string, any>,
      status: "QUEUED",
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      idempotencyKey: options.idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const saved = await this.repository.createJob(job);
    return saved;
  }

  public async cancel(jobId: string): Promise<boolean> {
    const controller = this.abortControllers.get(jobId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(jobId);
    }

    const job = await this.repository.getJob(jobId);
    if (!job) return false;

    if (job.status === "COMPLETED" || job.status === "DEAD_LETTER") {
      return false;
    }

    await this.repository.updateJob(jobId, {
      status: "CANCELLED",
      completedAt: new Date()
    });
    return true;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleTick();
  }

  public stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private scheduleTick(): void {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.tick();
      this.scheduleTick();
    }, this.pollIntervalMs);
  }

  public async tick(): Promise<void> {
    if (this.activeCount >= this.concurrency) return;

    // Find any queued job across handlers
    for (const [name, handler] of this.handlers.entries()) {
      if (this.activeCount >= this.concurrency) break;

      const jobs = await this.repository.listJobs(undefined, "QUEUED");
      const matchedJob = jobs.find((j) => j.name === name);

      if (matchedJob) {
        await this.processJob(matchedJob, handler);
      }
    }
  }


  public async processJob(job: BackgroundJob, handler: JobHandler): Promise<void> {
    this.activeCount++;
    const abortController = new AbortController();
    this.abortControllers.set(job.id, abortController);

    await this.repository.updateJob(job.id, {
      status: "PROCESSING",
      attempts: job.attempts + 1,
      startedAt: new Date()
    });

    const updateProgress = async (pct: number) => {
      const clamped = Math.max(0, Math.min(100, pct));
      await this.repository.updateJob(job.id, { progress: clamped });
    };

    try {
      const result = await handler(job, updateProgress, abortController.signal);

      if (abortController.signal.aborted) {
        await this.repository.updateJob(job.id, {
          status: "CANCELLED",
          completedAt: new Date()
        });
      } else {
        await this.repository.updateJob(job.id, {
          status: "COMPLETED",
          progress: 100,
          result,
          completedAt: new Date()
        });
      }
    } catch (err: any) {
      const isDeadLetter = job.attempts + 1 >= job.maxAttempts;
      await this.repository.updateJob(job.id, {
        status: isDeadLetter ? "DEAD_LETTER" : "FAILED",
        lastError: err?.message || String(err),
        completedAt: isDeadLetter ? new Date() : undefined
      });
    } finally {
      this.abortControllers.delete(job.id);
      this.activeCount--;
    }
  }
}
