/**
 * Logger types and utilities for client-side logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

export interface ApiLogDetails {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestSize?: number;
  responseSize?: number;
  headers?: Record<string, string>;
}

export interface SecurityLogDetails {
  action: string;
  status: string;
  userId?: string;
  method?: string;
  ip?: string;
}

export interface PerformanceLogDetails {
  operation: string;
  duration: number;
  component?: string;
  success?: boolean;
  error?: any;
}

export interface UserActionLogDetails {
  action: string;
  element?: string;
  page?: string;
  userId?: string;
  sessionId?: string;
}

export interface ClientInfo {
  userAgent: string;
  screenSize: string;
  url: string;
  sessionId: string;
  version?: string;
  environment?: string;
}

export interface LoggerConfig {
  sendToServer: boolean;
  storeInLocalStorage: boolean;
  level: LogLevel;
  maxBufferSize?: number;
  flushInterval?: number;
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
  private startTime: number;
  
  constructor(private operation: string) {
    this.startTime = Date.now();
  }
  
  finish(details?: any): { operation: string; duration: number; details?: any } {
    const duration = Date.now() - this.startTime;
    return {
      operation: this.operation,
      duration,
      details
    };
  }
  
  static async measureAsync<T>(
    operation: string, 
    fn: () => Promise<T>,
    logger?: (operation: string, duration: number, details?: any) => void
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      if (logger) {
        logger(operation, duration, { success: true });
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (logger) {
        logger(operation, duration, { success: false, error });
      }
      throw error;
    }
  }
  
  static measureSync<T>(
    operation: string, 
    fn: () => T,
    logger?: (operation: string, duration: number, details?: any) => void
  ): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      if (logger) {
        logger(operation, duration, { success: true });
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      if (logger) {
        logger(operation, duration, { success: false, error });
      }
      throw error;
    }
  }
}
