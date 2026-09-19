import { ExternalServiceError } from "../errors/errors.js";
import { logger } from "../observability/tracing.js";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold: number; // consecutive failures before opening
  recoveryTimeoutMs: number; // cooldown before half-open probe
  monitoringWindowMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private nextAttemptAt = 0;

  constructor(
    public readonly name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      recoveryTimeoutMs: 15000,
    }
  ) {}

  getState(): CircuitState {
    if (this.state === "OPEN" && Date.now() >= this.nextAttemptAt) {
      this.state = "HALF_OPEN";
      logger.info(`Circuit '${this.name}' transitioned to HALF_OPEN (probing health)`);
    }
    return this.state;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      throw new ExternalServiceError(
        this.name,
        `Circuit breaker is OPEN. Fast-failing request to protect system stability.`
      );
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      logger.info(`Circuit '${this.name}' recovered: transitioned to CLOSED`);
    }
  }

  private onFailure(err: unknown) {
    this.failureCount++;
    logger.warn(`Circuit '${this.name}' failure (${this.failureCount}/${this.options.failureThreshold}): ${String(err)}`);

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptAt = Date.now() + this.options.recoveryTimeoutMs;
      logger.error(`Circuit '${this.name}' OPENED. Failing fast for ${this.options.recoveryTimeoutMs}ms`);
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.nextAttemptAt = 0;
  }
}
