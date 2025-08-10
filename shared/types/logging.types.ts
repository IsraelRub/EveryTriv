/**
 * Shared types for logging system across client and server
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
}

// API request/response types for client-logs endpoint
export interface ClientLogSyncRequest {
  content: string;
}

export interface ClientLogSyncResponse {
  success: boolean;
  error?: string;
}

// Shared emoji mapping for consistent logging display
export const LOG_EMOJIS = {
  error: '❌',
  warn: '⚠️',
  info: '🚀',
  debug: '🔧',
} as const;

// Additional specialized emojis for specific logging contexts
export const SPECIALIZED_EMOJIS = {
  api: '🌐',
  user: '👤',
  auth: '🔐',
  validation: '🔍',
  performance: {
    fast: '⚡',
    normal: '⏱️',
    slow: '🐌',
  },
  http: {
    success: '🟢',
    redirect: '🟡',
    clientError: '🔴',
    serverError: '💥',
  },
} as const;
