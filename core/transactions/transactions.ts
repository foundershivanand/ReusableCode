import { InternalError } from "../errors/errors.js";
import { logger } from "../observability/tracing.js";

export interface TransactionContext {
  id: string;
  isCommitted: boolean;
  isRolledBack: boolean;
  metadata?: Record<string, unknown>;
}

export interface UnitOfWork {
  execute<T>(operation: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

export class InMemoryUnitOfWork implements UnitOfWork {
  async execute<T>(operation: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const tx: TransactionContext = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      isCommitted: false,
      isRolledBack: false,
    };

    try {
      const result = await operation(tx);
      tx.isCommitted = true;
      return result;
    } catch (err) {
      tx.isRolledBack = true;
      throw err;
    }
  }
}

export interface SagaStep<TContext = any> {
  name: string;
  execute: (context: TContext) => Promise<void>;
  compensate: (context: TContext) => Promise<void>;
}

export class SagaCoordinator<TContext = any> {
  private steps: SagaStep<TContext>[] = [];

  addStep(step: SagaStep<TContext>): this {
    this.steps.push(step);
    return this;
  }

  async execute(context: TContext): Promise<{ success: boolean; executedSteps: string[]; error?: unknown }> {
    const completedSteps: SagaStep<TContext>[] = [];

    for (const step of this.steps) {
      try {
        logger.info(`Executing Saga step: ${step.name}`);
        await step.execute(context);
        completedSteps.push(step);
      } catch (stepError) {
        logger.error(`Saga step failed: ${step.name}. Commencing compensation rollback...`, {
          stepName: step.name,
          error: String(stepError),
        });

        // Rollback completed steps in reverse order
        const rollbackErrors: Array<{ step: string; error: unknown }> = [];
        for (let i = completedSteps.length - 1; i >= 0; i--) {
          const compStep = completedSteps[i];
          try {
            logger.warn(`Compensating Saga step: ${compStep.name}`);
            await compStep.compensate(context);
          } catch (compError) {
            logger.error(`Compensation failed for step: ${compStep.name}`, { error: String(compError) });
            rollbackErrors.push({ step: compStep.name, error: compError });
          }
        }

        if (rollbackErrors.length > 0) {
          throw new InternalError(`Saga rollback encountered errors during compensation`, {
            stepError,
            rollbackErrors,
          });
        }

        throw stepError;
      }
    }

    return {
      success: true,
      executedSteps: completedSteps.map((s) => s.name),
    };
  }
}
