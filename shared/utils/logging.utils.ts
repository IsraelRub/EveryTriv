/**
 * Shared logging utilities and formatters
 */

import { LOG_EMOJIS, SPECIALIZED_EMOJIS, LogLevel } from '../types/logging.types';

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  FAST: 200,
  NORMAL: 500,
  SLOW: 1000,
} as const;

// Performance level calculation
export function getPerformanceLevel(duration: number): LogLevel {
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) return 'warn';
  if (duration > PERFORMANCE_THRESHOLDS.NORMAL) return 'info';
  return 'debug';
}

// Performance emoji calculation
export function getPerformanceEmoji(duration: number): string {
  if (duration > PERFORMANCE_THRESHOLDS.SLOW) return SPECIALIZED_EMOJIS.performance.slow;
  if (duration > PERFORMANCE_THRESHOLDS.NORMAL) return SPECIALIZED_EMOJIS.performance.normal;
  return SPECIALIZED_EMOJIS.performance.fast;
}

// Format performance message
export function formatPerformanceMessage(operation: string, duration: number): string {
  const emoji = getPerformanceEmoji(duration);
  return `${emoji} ${operation}: ${duration}ms`;
}

// Format API message
export function formatApiMessage(message: string): string {
  return `${SPECIALIZED_EMOJIS.api} API: ${message}`;
}

// Format user message
export function formatUserMessage(message: string): string {
  return `${SPECIALIZED_EMOJIS.user} User: ${message}`;
}

// Format auth message
export function formatAuthMessage(message: string): string {
  return `${SPECIALIZED_EMOJIS.auth} Auth: ${message}`;
}

// Format validation error message
export function formatValidationMessage(field: string, constraint: string): string {
  return `${SPECIALIZED_EMOJIS.validation} Validation failed for ${field}: ${constraint}`;
}

// HTTP status emoji calculation
export function getHttpStatusEmoji(statusCode: number): string {
  if (statusCode >= 500) return SPECIALIZED_EMOJIS.http.serverError;
  if (statusCode >= 400) return SPECIALIZED_EMOJIS.http.clientError;
  if (statusCode >= 300) return SPECIALIZED_EMOJIS.http.redirect;
  return SPECIALIZED_EMOJIS.http.success;
}

// Format HTTP error message
export function formatHttpErrorMessage(method: string, url: string, statusCode: number, message: string): string {
  const emoji = getHttpStatusEmoji(statusCode);
  return `${emoji} HTTP ${statusCode} ${method} ${url}: ${message}`;
}

// Format HTTP request message
export function formatHttpRequestMessage(method: string, url: string, statusCode: number, duration: number): string {
  const emoji = getHttpStatusEmoji(statusCode);
  return `${emoji} ${method} ${url} ${statusCode} (${duration}ms)`;
}

// Format startup message
export function formatStartupMessage(message: string): string {
  return `🚀 ${message}`;
}

// Common log entry formatter for files
export function formatLogEntry(timestamp: string, level: string, message: string, meta?: any): string {
  const emoji = LOG_EMOJIS[level as keyof typeof LOG_EMOJIS] || LOG_EMOJIS.info;
  return `[${timestamp}] [${level.toUpperCase()}] ${emoji} ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
}

// Format message with context
export function formatContextMessage(message: string, context?: string): string {
  return context ? `[${context}] ${message}` : message;
}
