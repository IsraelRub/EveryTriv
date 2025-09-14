/**
 * Logger Module
 *
 * @module Logger
 * @description Complete logger module with all implementations and utilities
 * @author EveryTriv Team
 */

/**
 * Base logger service
 * @description Abstract base logger service with common functionality
 */
export { BaseLoggerService } from './baseLogger.service';

/**
 * Client logger implementations
 * @description Client-side logger services and factory functions
 */
export { ClientLogger, clientLogger, createClientLogger } from './clientLogger.service';

/**
 * Server logger implementations
 * @description Server-side logger services and factory functions
 */
export { createServerLogger,ServerLogger, serverLogger } from './serverLogger.service';

/**
 * Logger type definitions
 * @description Comprehensive set of logger interface and type definitions
 */
export type {
	ApiLogger,
	BaseLogger,
	BusinessLogger,
	CacheLogger,
	ClientLogEntry,
	ClientLogsRequest,
	DatabaseLogger,
	EnhancedLogEntry,
	GameLogger,
	HttpLogData,
	HttpLogger,
	Logger as ILogger,
	LogContext,
	LogEntry,
	LogMeta,
	PaymentLogger,
	PerformanceLogger,
	SecurityLogger,
	SystemLogger,
	UserLogger,
	ValidationLogger,
} from '../../types';

/**
 * Logger constants and configuration
 * @description Log levels, icons, formatters, and performance thresholds
 */
export { LOG_ICONS, LogLevel, MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from '../../constants';
