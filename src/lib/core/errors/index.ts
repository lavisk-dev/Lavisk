export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 422, metadata);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "BUSINESS_RULE_ERROR", 409, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} not found: ${id}` : `${entity} not found`,
      "NOT_FOUND",
      404,
      { entity, entityId: id }
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "PAYMENT_ERROR", 400, metadata);
  }
}

export class InventoryError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "INVENTORY_ERROR", 409, metadata);
  }
}

export class NotificationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, "NOTIFICATION_ERROR", 500, metadata);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR", 500);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", 500);
  }
  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500);
}