import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { log } from '../../utils/logger';

@Injectable()
export class LoggerService implements NestLoggerService {
  // Basic NestJS LoggerService interface methods
  log(message: string, context?: string) {
    log.info(context ? `[${context}] ${message}` : message);
  }
  
  error(message: string, stackOrMeta?: string | any, context?: string) {
    // Handle both old signature (stack) and new signature (meta object)
    if (typeof stackOrMeta === 'string') {
      // Old signature with stack
      if (context) {
        log.nestError(context, message, { stack: stackOrMeta });
      } else {
        log.error(message, { stack: stackOrMeta });
      }
    } else {
      // New signature with meta object
      if (context) {
        log.nestError(context, message, stackOrMeta);
      } else {
        log.error(message, stackOrMeta);
      }
    }
  }

  warn(message: string, contextOrMeta?: string | any) {
    if (typeof contextOrMeta === 'string') {
      log.warn(`[${contextOrMeta}] ${message}`);
    } else {
      log.warn(message, contextOrMeta);
    }
  }

  debug(message: string, contextOrMeta?: string | any, meta?: any) {
    if (typeof contextOrMeta === 'string') {
      log.debug(`[${contextOrMeta}] ${message}`, meta);
    } else {
      log.debug(message, contextOrMeta);
    }
  }

  verbose(message: string, context?: string) {
    this.debug(message, context);
  }

  // Additional methods for compatibility with existing code
  info(message: string, meta?: any) {
    log.info(message, meta);
  }

  // Legacy methods that are used in main.ts - simple wrappers
  logStartup(message: string, details?: any) {
    log.info(`🚀 ${message}`, details);
  }

  logPerformance(operation: string, duration: number, details?: any) {
    const level = duration > 1000 ? 'warn' : 'info';
    const emoji = duration > 1000 ? '🐌' : '⚡';
    log[level](`${emoji} ${operation}: ${duration}ms`, { duration, ...details });
  }
}