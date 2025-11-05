export interface AppErrorOptions {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? 400;
    this.details = options.details;
    if (options.cause) {
      (this as Error).cause = options.cause;
    }
    Error.captureStackTrace?.(this, AppError);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
