// ============================================
// Standardized API Response Helpers
// ============================================
// Provides consistent response format across all API routes.

import { NextResponse } from 'next/server';
import { logger } from './logger';

// ============================================
// Response Types
// ============================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page?: number;
  limit: number;
  total?: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business Logic
  INSUFFICIENT_TOKENS: 'INSUFFICIENT_TOKENS',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  ACTION_NOT_ALLOWED: 'ACTION_NOT_ALLOWED',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================
// Response Helpers
// ============================================

/**
 * Create a successful API response
 */
export function success<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return NextResponse.json(response, { status });
}

/**
 * Create an error API response
 */
export function error(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorObj: ApiErrorResponse['error'] = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: errorObj,
  };
  return NextResponse.json(response, { status });
}

// ============================================
// Common Error Responses
// ============================================

export function unauthorized(message = 'Authentication required'): NextResponse<ApiErrorResponse> {
  return error(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(message = 'Access denied'): NextResponse<ApiErrorResponse> {
  return error(ErrorCodes.FORBIDDEN, message, 403);
}

export function notFound(resource = 'Resource'): NextResponse<ApiErrorResponse> {
  return error(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
}

export function validationError(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return error(ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function insufficientTokens(required: number, available: number): NextResponse<ApiErrorResponse> {
  return error(
    ErrorCodes.INSUFFICIENT_TOKENS,
    `Insufficient tokens. Need ${required}, have ${available}`,
    402,
    { required, available }
  );
}

export function rateLimited(retryAfterSeconds?: number): NextResponse<ApiErrorResponse> {
  const response = error(
    ErrorCodes.RATE_LIMITED,
    'Too many requests. Please try again later.',
    429,
    retryAfterSeconds ? { retryAfter: retryAfterSeconds } : undefined
  );

  if (retryAfterSeconds) {
    response.headers.set('Retry-After', String(retryAfterSeconds));
  }

  return response;
}

export function internalError(err?: Error | unknown, requestContext?: string): NextResponse<ApiErrorResponse> {
  // Log the actual error
  if (err) {
    logger.error(`Internal error${requestContext ? ` in ${requestContext}` : ''}`, err);
  }

  return error(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred', 500);
}

export function serviceUnavailable(service = 'Service'): NextResponse<ApiErrorResponse> {
  return error(ErrorCodes.SERVICE_UNAVAILABLE, `${service} is temporarily unavailable`, 503);
}

// ============================================
// Pagination Helper
// ============================================

export function withPagination<T>(
  data: T[],
  pagination: PaginationMeta
): { data: T[]; meta: { pagination: PaginationMeta } } {
  return {
    data,
    meta: { pagination },
  };
}

// ============================================
// Response Type Guards
// ============================================

export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}
