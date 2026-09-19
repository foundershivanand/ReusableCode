import { RateLimitError } from "../errors/errors.js";

export interface BulkheadOptions {
  maxConcurrent: number;
  maxQueue: number;
}

export class Bulkhead {
  private activeCount = 0;
  private queue: Array<() => void> = [];

  constructor(
    public readonly name: string,
    private options: BulkheadOptions = {
      maxConcurrent: 50,
      maxQueue: 100,
    }
  ) {}

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.options.maxConcurrent) {
      if (this.queue.length >= this.options.maxQueue) {
        throw new RateLimitError(5, new Error(`Bulkhead '${this.name}' queue is full (${this.options.maxQueue})`));
      }

      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.activeCount++;
    try {
      return await action();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }

  getMetrics() {
    return {
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      maxConcurrent: this.options.maxConcurrent,
      maxQueue: this.options.maxQueue,
    };
  }
}
