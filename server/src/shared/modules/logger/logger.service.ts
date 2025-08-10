import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { log } from '../../../shared/utils/logger';
import { 
  formatStartupMessage, 
  formatPerformanceMessage, 
  formatApiMessage, 
  formatUserMessage, 
  formatContextMessage,
  getPerformanceLevel 
} from '../../../../../shared/utils/logging.utils';

@Injectable()
export class LoggerService implements NestLoggerService {
  // Basic NestJS LoggerService interface methods
  log(message: string, context?: string) {
    log.info(formatContextMessage(message, context));
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
      log.warn(formatContextMessage(message, contextOrMeta));
    } else {
      log.warn(message, contextOrMeta);
    }
  }

  debug(message: string, contextOrMeta?: string | any, meta?: any) {
    if (typeof contextOrMeta === 'string') {
      log.debug(formatContextMessage(message, contextOrMeta), meta);
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
    log.info(formatStartupMessage(message), details);
  }

  logPerformance(operation: string, duration: number, details?: any) {
    const level = getPerformanceLevel(duration);
    const message = formatPerformanceMessage(operation, duration);
    log[level](message, { duration, ...details });
  }

  // Additional specialized methods for better consistency
  auth(message: string, meta?: any) {
    log.auth(message, meta);
  }

  api(message: string, meta?: any) {
    log.info(formatApiMessage(message), meta);
  }

  user(message: string, meta?: any) {
    log.info(formatUserMessage(message), meta);
  }

  validationError(field: string, value: any, constraint: string, meta?: any) {
    log.validationError(field, value, constraint, meta);
  }

  httpError(method: string, url: string, statusCode: number, message: string, error?: any) {
    log.httpError(method, url, statusCode, message, error);
  }

  nestError(context: string, message: string, error?: any) {
    log.nestError(context, message, error);
  }
}