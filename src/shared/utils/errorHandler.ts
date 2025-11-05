import type { ApiFailure } from '../types/api.types';

export class ApiError extends Error {
  constructor(public readonly payload: ApiFailure['error'], message?: string) {
    super(message ?? payload.message);
    this.name = 'ApiError';
  }
}

export function assertSuccess<T>(response: unknown): asserts response is { success: true; data: T } {
  const value = response as { success?: boolean };
  if (!value || value.success !== true) {
    const errorPayload = response as ApiFailure;
    throw new ApiError(errorPayload.error ?? { code: 'UNKNOWN', message: 'Erro desconhecido' });
  }
}

export function mapApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.payload.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
