export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "BUSINESS_RULE_VIOLATION"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_SERVER_ERROR";

export interface UserFacingErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: Record<string, unknown> | Array<unknown>;
  };
}

export abstract class AppError extends Error {
  public abstract readonly code: ErrorCode;
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly userFacingMessage: string;
  public readonly details?: Record<string, unknown> | Array<unknown>;

  constructor(message: string, options?: {
    userFacingMessage?: string;
    details?: Record<string, unknown> | Array<unknown>;
    cause?: unknown;
  }) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.userFacingMessage = options?.userFacingMessage || message;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  public readonly code = "VALIDATION_ERROR";
  public readonly statusCode = 400;

  constructor(message: string = "Invalid request payload", details?: Record<string, unknown> | Array<unknown>, cause?: unknown) {
    super(message, {
      userFacingMessage: "The provided data is invalid. Please correct the errors and try again.",
      details,
      cause,
    });
  }
}

export class AuthenticationError extends AppError {
  public readonly code = "AUTHENTICATION_ERROR";
  public readonly statusCode = 401;

  constructor(message: string = "Authentication required", cause?: unknown) {
    super(message, {
      userFacingMessage: "You must be authenticated to access this resource.",
      cause,
    });
  }
}

export class AuthorizationError extends AppError {
  public readonly code = "AUTHORIZATION_ERROR";
  public readonly statusCode = 403;

  constructor(message: string = "Permission denied", cause?: unknown) {
    super(message, {
      userFacingMessage: "You do not have permission to perform this action.",
      cause,
    });
  }
}

export class NotFoundError extends AppError {
  public readonly code = "NOT_FOUND";
  public readonly statusCode = 404;

  constructor(resource: string = "Resource", identifier?: string, cause?: unknown) {
    const msg = identifier ? `${resource} '${identifier}' not found` : `${resource} not found`;
    super(msg, {
      userFacingMessage: "The requested resource could not be found.",
      details: identifier ? { resource, identifier } : { resource },
      cause,
    });
  }
}

export class ConflictError extends AppError {
  public readonly code = "CONFLICT";
  public readonly statusCode = 409;

  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, {
      userFacingMessage: "A conflict occurred with the current state of the resource.",
      details,
      cause,
    });
  }
}

export class RateLimitError extends AppError {
  public readonly code = "RATE_LIMIT_EXCEEDED";
  public readonly statusCode = 429;
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number = 60, cause?: unknown) {
    super(`Rate limit exceeded. Retry after ${retryAfterSeconds}s`, {
      userFacingMessage: `Too many requests. Please wait ${retryAfterSeconds} seconds before retrying.`,
      details: { retryAfterSeconds },
      cause,
    });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class BusinessRuleError extends AppError {
  public readonly code = "BUSINESS_RULE_VIOLATION";
  public readonly statusCode = 422;

  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, {
      userFacingMessage: message,
      details,
      cause,
    });
  }
}

export class ExternalServiceError extends AppError {
  public readonly code = "EXTERNAL_SERVICE_ERROR";
  public readonly statusCode = 502;
  public readonly serviceName: string;

  constructor(serviceName: string, internalMessage: string, cause?: unknown) {
    super(`External service '${serviceName}' failure: ${internalMessage}`, {
      userFacingMessage: "An external dependency temporarily failed. Please try again shortly.",
      cause,
    });
    this.serviceName = serviceName;
  }
}

export class InternalError extends AppError {
  public readonly code = "INTERNAL_SERVER_ERROR";
  public readonly statusCode = 500;

  constructor(internalMessage: string = "An internal error occurred", cause?: unknown) {
    super(internalMessage, {
      userFacingMessage: "An unexpected error occurred. Please contact support if the issue persists.",
      cause,
    });
  }
}

/**
 * Transforms any caught error into a safe, non-leaking user-facing response.
 * Internal details (SQL queries, secrets, stack traces) are stripped.
 */
export function formatUserFacingError(error: unknown, requestId: string): {
  statusCode: number;
  body: UserFacingErrorResponse;
} {
  if (error instanceof AppError && error.isOperational) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.userFacingMessage,
          requestId,
          details: error.details,
        },
      },
    };
  }

  // Unhandled / system error: Never leak internal details
  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected internal error occurred. Please contact support.",
        requestId,
      },
    },
  };
}
