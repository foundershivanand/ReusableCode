import { ZodSchema } from "zod";
import { generatePrefixedId } from "../ids/ids.js";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  InternalError,
  formatUserFacingError,
  UserFacingErrorResponse,
} from "../errors/errors.js";
import {
  createTraceContext,
  runWithTraceContext,
  logger,
  TraceContext,
} from "../observability/tracing.js";
import { Actor, Resource, defaultAuthorizationEngine } from "../authz/authz.js";
import { InMemoryUnitOfWork, UnitOfWork } from "../transactions/transactions.js";

export interface PipelineRequest {
  id?: string;
  traceId?: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  actor?: Actor;
  tenantId?: string;
  body?: unknown;
  params?: Record<string, unknown>;
  ipAddress?: string;
}

export interface PipelineContext<TInput = any> {
  requestId: string;
  traceContext: TraceContext;
  actor?: Actor;
  tenantId?: string;
  input: TInput;
  ipAddress: string;
  unitOfWork: UnitOfWork;
}

export interface RateLimitRule {
  key: (req: PipelineRequest) => string;
  limit: number;
  windowMs: number;
}

// Bounded memory-safe sliding window rate limiter
const MAX_RATE_LIMIT_KEYS = 50_000;
const rateLimitCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(rule: RateLimitRule, req: PipelineRequest) {
  const key = rule.key(req);
  const now = Date.now();
  const record = rateLimitCounts.get(key);

  if (!record || record.resetAt <= now) {
    if (rateLimitCounts.size >= MAX_RATE_LIMIT_KEYS) {
      // Sweep expired entries to reclaim memory
      for (const [k, v] of rateLimitCounts.entries()) {
        if (v.resetAt <= now) {
          rateLimitCounts.delete(k);
        }
      }
      // If still above threshold, evict oldest
      if (rateLimitCounts.size >= MAX_RATE_LIMIT_KEYS) {
        const oldestKey = rateLimitCounts.keys().next().value;
        if (oldestKey) rateLimitCounts.delete(oldestKey);
      }
    }
    rateLimitCounts.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  if (record.count >= rule.limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    throw new RateLimitError(retryAfter);
  }

  record.count += 1;
}

export interface PipelineDefinition<TInput = any, TOutput = any> {
  inputSchema?: ZodSchema<TInput>;
  outputSchema?: ZodSchema<TOutput>;
  requireAuth?: boolean;
  resource?: (ctx: PipelineContext<TInput>) => Resource;
  action?: string;
  rateLimit?: RateLimitRule;
  transactional?: boolean;
  handler: (ctx: PipelineContext<TInput>) => Promise<TOutput>;
  auditEvent?: (ctx: PipelineContext<TInput>, output: TOutput) => Promise<void> | void;
}

export interface PipelineResponse<TOutput = any> {
  statusCode: number;
  headers: Record<string, string>;
  body: TOutput | UserFacingErrorResponse;
}

export async function executePipeline<TInput, TOutput>(
  definition: PipelineDefinition<TInput, TOutput>,
  request: PipelineRequest,
  unitOfWork: UnitOfWork = new InMemoryUnitOfWork()
): Promise<PipelineResponse<TOutput>> {
  // 1. Request ID & Trace ID
  const requestId = request.id || generatePrefixedId("req");
  const traceCtx = createTraceContext({
    traceId: request.traceId || generatePrefixedId("trace"),
    route: `${request.method || "GET"} ${request.path || "/"}`,
    tenantId: request.tenantId || request.actor?.tenantId,
    actorId: request.actor?.id,
  });

  return runWithTraceContext(traceCtx, async () => {
    try {
      // 2. Parse & Schema Validation
      let parsedInput: TInput = (request.body ?? {}) as TInput;
      if (definition.inputSchema) {
        const validationResult = definition.inputSchema.safeParse(request.body);
        if (!validationResult.success) {
          throw new ValidationError(
            "Input validation failed",
            validationResult.error.issues
          );
        }
        parsedInput = validationResult.data;
      }

      // 3. Authentication
      if (definition.requireAuth !== false) {
        if (!request.actor || !request.actor.id) {
          throw new AuthenticationError("Authentication required for this operation");
        }
      }

      // 4. Tenant Resolution
      const tenantId = request.tenantId || request.actor?.tenantId;

      // 5. Authorization
      if (definition.action && request.actor) {
        const resource: Resource = definition.resource
          ? definition.resource({
              requestId,
              traceContext: traceCtx,
              actor: request.actor,
              tenantId,
              input: parsedInput,
              ipAddress: request.ipAddress || "127.0.0.1",
              unitOfWork,
            })
          : { type: "system", tenantId };

        const authResult = await defaultAuthorizationEngine.authorize({
          actor: request.actor,
          action: definition.action,
          resource,
          tenant: tenantId,
        });

        if (!authResult.allowed) {
          throw new AuthorizationError(authResult.reason || "Unauthorized action");
        }
      }

      // 6. Rate Limit / Abuse Controls
      if (definition.rateLimit) {
        checkRateLimit(definition.rateLimit, request);
      }

      // Context Setup
      const ctx: PipelineContext<TInput> = {
        requestId,
        traceContext: traceCtx,
        actor: request.actor,
        tenantId,
        input: parsedInput,
        ipAddress: request.ipAddress || "127.0.0.1",
        unitOfWork,
      };

      // 7. Business Logic + Database Transaction
      let result: TOutput;
      if (definition.transactional) {
        result = await unitOfWork.execute(async () => {
          return await definition.handler(ctx);
        });
      } else {
        result = await definition.handler(ctx);
      }

      // 8. Output Schema Validation (Fails closed if violated to prevent internal data leaks)
      let validatedOutput = result;
      if (definition.outputSchema) {
        const outValidation = definition.outputSchema.safeParse(result);
        if (!outValidation.success) {
          logger.error("Output validation schema failure", {
            errors: outValidation.error.issues,
          });
          throw new InternalError("Output failed schema validation - data transmission prevented");
        }
        validatedOutput = outValidation.data;
      }

      // 9. Audit / Event
      if (definition.auditEvent) {
        try {
          await definition.auditEvent(ctx, validatedOutput);
        } catch (auditErr) {
          logger.error("Failed to write audit event", { error: String(auditErr) });
        }
      }

      // 10. Response
      return {
        statusCode: 200,
        headers: {
          "x-request-id": requestId,
          "x-trace-id": traceCtx.traceId,
          "content-type": "application/json",
        },
        body: validatedOutput,
      };
    } catch (err: unknown) {
      logger.error("Request pipeline failed with error", { error: String(err) });
      const { statusCode, body } = formatUserFacingError(err, requestId);
      return {
        statusCode,
        headers: {
          "x-request-id": requestId,
          "x-trace-id": traceCtx.traceId,
          "content-type": "application/json",
        },
        body,
      };
    }
  });
}
