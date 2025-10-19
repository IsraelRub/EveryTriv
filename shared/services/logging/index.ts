/**
 * Logger Module
 *
 * @module Logger
 * @description Complete logging module with all implementations and utilities
 * @author EveryTriv Team
 */

/**
 * Base logger service
 * @description Abstract base logger service with common functionality
 */
export { BaseLoggerService } from './baseLogger.service';

/**
 * Server logger implementations
 * @description Server-side logger services
 */
export { serverLogger } from './serverLogger.service';

/**
 * Client logger implementations
 * @description Client-side logger services
 */
export { clientLogger } from './clientLogger.service';

/**
 * Logger type definitions
 * @description Comprehensive set of logger interface and type definitions
 */
export type {
	ClientLogsRequest,
	EnhancedLogEntry,
	Logger as ILogger,
	LogMeta,
} from '../../types';

/**
 * Logger constants and configuration
 * @description Log levels, icons, formatters, and performance thresholds
 */
export { LOG_ICONS, LogLevel, MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from '../../constants';
