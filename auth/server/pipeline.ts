import { z } from "zod";
import { UserRole } from "../schemas/auth-schemas.js";
import { AuditLogger } from "./audit-logger.js";
import { UserRecord } from "./repository.js";
import { SessionService } from "./session-service.js";

export interface PipelineContext<TInput, TAuth = UserRecord> {
  rawRequest: {
    body?: unknown;
    query?: Record<string, string | string[]>;
    headers?: Record<string, string | string[]>;
    params?: Record<string, string>;
    cookies?: Record<string, string>;
    ip?: string;
    userAgent?: string;
  };
  validatedInput?: TInput;
  authSession?: { id: string; userId: string };
  user?: TAuth;
  tenantId?: string | null;
  permissions?: string[];
  requestId: string;
}

export interface PipelineConfig<TInput, TOutput> {
  inputSchema?: z.ZodType<TInput>;
  outputSchema?: z.ZodType<TOutput>;
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: string[];
  resolveTenant?: (ctx: PipelineContext<TInput>) => Promise<string | null> | string | null;
  auditAction?: string;
  maxBodySizeBytes?: number; // Oversized request protection
  handler: (ctx: Required<PipelineContext<TInput>>) => Promise<TOutput>;
}

export interface PipelineResponse<TOutput> {
  status: number;
  data?: TOutput;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  headers?: Record<string, string>;
}

export class ServerPipeline {
  private sessionService: SessionService;
  private auditLogger: AuditLogger;

  constructor(sessionService: SessionService, auditLogger: AuditLogger) {
    this.sessionService = sessionService;
    this.auditLogger = auditLogger;
  }

  /**
   * Executes the formal 10-step server pipeline:
   * 1. Parse request & check size limits
   * 2. Validate schema
   * 3. Authenticate
   * 4. Load authoritative identity
   * 5. Resolve tenant/context
   * 6. Authorize
   * 7. Execute business logic
   * 8. Validate output
   * 9. Audit
   * 10. Respond
   */
  async execute<TInput, TOutput>(
    rawRequest: PipelineContext<TInput>["rawRequest"],
    config: PipelineConfig<TInput, TOutput>
  ): Promise<PipelineResponse<TOutput>> {
    const requestId = crypto.randomUUID();

    const ctx: PipelineContext<TInput> = {
      rawRequest,
      requestId,
    };

    try {
      // Step 1: Parse request & oversized request protection
      if (config.maxBodySizeBytes && rawRequest.body) {
        const bodyStr = JSON.stringify(rawRequest.body);
        if (Buffer.byteLength(bodyStr, "utf8") > config.maxBodySizeBytes) {
          return {
            status: 413,
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: `Request body exceeds maximum allowed size of ${config.maxBodySizeBytes} bytes`,
            },
          };
        }
      }

      // Step 2: Validate input schema (Server-side validation: NON-NEGOTIABLE)
      if (config.inputSchema) {
        const parseResult = config.inputSchema.safeParse(rawRequest.body);
        if (!parseResult.success) {
          return {
            status: 400,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request data",
              details: parseResult.error.issues,
            },
          };
        }
        ctx.validatedInput = parseResult.data;
      }

      // Step 3 & 4: Authenticate & Load authoritative identity
      const authHeader = rawRequest.headers?.["authorization"];
      const cookieHeader = rawRequest.headers?.["cookie"];
      let token: string | null = null;

      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      } else if (rawRequest.cookies?.["__Host-auth_session"]) {
        token = rawRequest.cookies["__Host-auth_session"];
      } else if (typeof cookieHeader === "string") {
        const match = cookieHeader.match(/__Host-auth_session=([^;]+)/);
        if (match) token = match[1];
      }

      if (token) {
        const authResult = await this.sessionService.validateSession(token);
        if (authResult) {
          ctx.authSession = { id: authResult.session.id, userId: authResult.user.id };
          ctx.user = authResult.user;
        }
      }

      if (config.requireAuth && !ctx.user) {
        return {
          status: 401,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access this resource",
          },
        };
      }

      // Step 5: Resolve tenant/context
      if (config.resolveTenant) {
        ctx.tenantId = await config.resolveTenant(ctx);
      }

      // Step 6: Authorize (Server-side authorization: never trust client roles/permissions)
      if (config.requiredRole && ctx.user) {
        const allowedRoles = Array.isArray(config.requiredRole)
          ? config.requiredRole
          : [config.requiredRole];
        if (!allowedRoles.includes(ctx.user.role)) {
          return {
            status: 403,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions to perform this action",
            },
          };
        }
      }

      // Step 7: Execute business logic
      const output = await config.handler(ctx as Required<PipelineContext<TInput>>);

      // Step 8: Validate output schema
      let validatedOutput = output;
      if (config.outputSchema) {
        const outParse = config.outputSchema.safeParse(output);
        if (!outParse.success) {
          // Output validation failure should not expose internal schema errors
          return {
            status: 500,
            error: {
              code: "INTERNAL_ERROR",
              message: "An internal server error occurred while preparing response",
            },
          };
        }
        validatedOutput = outParse.data as Awaited<TOutput>;
      }

      // Step 9: Audit
      if (config.auditAction) {
        await this.auditLogger.log({
          actorType: ctx.user ? (ctx.user.role === "ADMIN" ? "ADMIN" : "USER") : "SYSTEM",
          actorId: ctx.user?.id || null,
          action: config.auditAction,
          tenantId: ctx.tenantId || null,
          ipAddress: rawRequest.ip,
          userAgent: rawRequest.userAgent,
          metadata: { requestId },
        });
      }

      // Step 10: Respond
      return {
        status: 200,
        data: validatedOutput,
        headers: {
          "X-Request-Id": requestId,
          "Content-Type": "application/json",
        },
      };
    } catch (err: any) {
      // Secure error normalization: Never expose stack traces, SQL, or internal topology
      return {
        status: 500,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "An unexpected error occurred",
        },
      };
    }
  }
}
