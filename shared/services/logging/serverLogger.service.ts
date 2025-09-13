/**
 * Server Logger Implementation
 *
 * @module ServerLogger
 * @description Server-specific logger implementation with file logging
 * @used_by server: server/src/shared/modules/logging/logger.service.ts
 */
// LogLevel is not used directly in this file, removed import
import * as fs from 'fs';
import * as path from 'path';

import type { BasicValue, StatsValue } from '../../types/core/data.types';
import { LoggerConfigUpdate,LogMeta } from '../../types/infrastructure/logging.types';
import { BaseLoggerService } from './baseLogger.service';

/**
 * Server Logger Implementation
 * Extends BaseLoggerService with server-specific logging behavior
 */
export class ServerLogger extends BaseLoggerService {
	private logDir: string;
	private logFile: string;
	private performanceMetrics: Map<string, { startTime: number; endTime?: number; duration?: number }>;
	private requestCounts: Map<string, number>;
	private errorCounts: Map<string, number>;

	// Enhanced performance tracking (from PerformanceManager)
	protected performanceStats: Map<
		string,
		{
			totalOperations: number;
			averageDuration: number;
			minDuration: number;
			maxDuration: number;
			slowOperations: number;
			errorCount: number;
			lastUpdated: Date;
		}
	> = new Map();
	protected performanceThresholds: Record<string, number> = {};

	// Enhanced logging configuration (from LoggingManager)
	private loggingConfig: {
		enableConsole?: boolean;
		enableFile?: boolean;
		enableColors?: boolean;
		logLevel?: 'debug' | 'info' | 'warn' | 'error';
		enablePerformanceLogging?: boolean;
		enableSecurityLogging?: boolean;
		enableUserActivityLogging?: boolean;
	} = {
		enableConsole: true,
		enableFile: true,
		enableColors: true,
		logLevel: 'info',
		enablePerformanceLogging: true,
		enableSecurityLogging: true,
		enableUserActivityLogging: true,
	};

	constructor(config?: LoggerConfigUpdate) {
		super(config);

		// Initialize performance tracking
		this.performanceMetrics = new Map();
		this.requestCounts = new Map();
		this.errorCounts = new Map();

		// Initialize performance thresholds
		this.initializePerformanceThresholds();

		// Check if we're in a browser environment
		if (typeof process === 'undefined') {
			// Browser environment - no file logging
			this.logDir = '';
			this.logFile = '';
			return;
		}

		// Server environment
		this.logDir = process.env.LOG_DIR || 'logs';
		this.logFile = path.join(this.logDir, 'server.log');
		this.ensureLogDirectory();
		this.clearLogFile(); // Clear log file on startup
	}

	protected logError(message: string, meta?: LogMeta): void {
		// Track error counts
		const errorType = (meta?.errorType as string) || 'unknown';
		this.errorCounts.set(errorType, (this.errorCounts.get(errorType) || 0) + 1);

		console.error(message, meta);
		this.writeToFile('ERROR', message, meta);
	}

	protected logWarn(message: string, meta?: LogMeta): void {
		console.warn(message, meta);
		this.writeToFile('WARN', message, meta);
	}

	protected logInfo(message: string, meta?: LogMeta): void {
		console.log(message, meta);
		this.writeToFile('INFO', message, meta);
	}

	protected logDebug(message: string, meta?: LogMeta): void {
		if (typeof process === 'undefined' || process.env.NODE_ENV !== 'prod') {
			console.log(message, meta);
			this.writeToFile('DEBUG', message, meta);
		}
	}

	private ensureLogDirectory(): void {
		if (typeof fs === 'undefined') return; // Browser environment

		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	private clearLogFile(): void {
		if (typeof fs === 'undefined') return; // Browser environment

		try {
			// Clear the log file by writing an empty string
			fs.writeFileSync(this.logFile, '', 'utf8');
		} catch (error) {
			console.error('Failed to clear log file:', error);
		}
	}

	// פונקציה לניקוי ידני של קובץ הלוג
	public clearLogFileManually(): void {
		if (typeof fs === 'undefined') return; // Browser environment

		try {
			// Clear the log file by writing an empty string
			fs.writeFileSync(this.logFile, '', 'utf8');
			console.log('📝 Log file manually cleared:', this.logFile);

			// Log the clearing action
			this.info('🧹 Log file manually cleared', {
				action: 'manual_clear',
				timestamp: new Date().toLocaleString('he-IL'),
				sessionId: this.getSessionId(),
				traceId: this.getTraceId(),
			});
		} catch (error) {
			console.error('Failed to manually clear log file:', error);
		}
	}

	private writeToFile(level: string, message: string, meta?: LogMeta): void {
		if (typeof fs === 'undefined') return; // Browser environment - no file logging

		try {
			// Create local timestamp
			const now = new Date();
			const localTimestamp = now.toLocaleString('he-IL', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const logEntry = {
				timestamp: now.toISOString(), // Keep ISO for structured data
				level,
				message,
				meta: meta || {},
				sessionId: this.getSessionId(),
				traceId: this.getTraceId(),
			};

			const logLine = `[${localTimestamp}] ${level}: ${message} | ${JSON.stringify(logEntry.meta)}\n`;

			fs.appendFileSync(this.logFile, logLine, 'utf8');
		} catch (error) {
			console.error('Failed to write to log file:', error);
		}
	}

	/**
	 * Start performance tracking for an operation
	 */
	public startPerformanceTracking(operationId: string): void {
		this.performanceMetrics.set(operationId, {
			startTime: Date.now(),
		});
	}

	/**
	 * End performance tracking and log the duration
	 */
	public endPerformanceTracking(operationId: string, meta?: LogMeta): number {
		const metric = this.performanceMetrics.get(operationId);
		if (!metric) {
			this.logWarn(`Performance tracking not found for operation: ${operationId}`);
			return 0;
		}

		const endTime = Date.now();
		const duration = endTime - metric.startTime;

		metric.endTime = endTime;
		metric.duration = duration;

		// Log performance metrics
		this.logInfo(`Performance tracking completed for ${operationId}`, {
			...meta,
			operationId,
			duration,
			startTime: metric.startTime,
			endTime,
		});

		// Clean up old metrics (keep only last 100)
		if (this.performanceMetrics.size > 100) {
			const firstKey = this.performanceMetrics.keys().next().value;
			if (firstKey) {
				this.performanceMetrics.delete(firstKey);
			}
		}

		return duration;
	}

	/**
	 * Track API request
	 */
	public trackApiRequest(endpoint: string, method: string, statusCode: number, duration?: number): void {
		const key = `${method}:${endpoint}`;
		this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);

		this.logInfo('API Request tracked', {
			endpoint,
			method,
			statusCode,
			duration,
			requestCount: this.requestCounts.get(key),
		});
	}

	/**
	 * Get performance metrics summary
	 */
	public getPerformanceMetrics(): {
		operations: Array<{ id: string; duration: number; startTime: number; endTime: number }>;
		requestCounts: Record<string, number>;
		errorCounts: Record<string, number>;
	} {
		const operations = Array.from(this.performanceMetrics.entries())
			.filter(([_, metric]) => metric.duration !== undefined)
			.map(([id, metric]) => ({
				id,
				duration: metric.duration!,
				startTime: metric.startTime,
				endTime: metric.endTime!,
			}));

		return {
			operations,
			requestCounts: Object.fromEntries(this.requestCounts),
			errorCounts: Object.fromEntries(this.errorCounts),
		};
	}

	/**
	 * Reset performance metrics
	 */
	public resetPerformanceMetrics(): void {
		this.performanceMetrics.clear();
		this.requestCounts.clear();
		this.errorCounts.clear();
		this.logInfo('Performance metrics reset');
	}

	/**
	 * Get session ID
	 */
	public getSessionId(): string {
		return this.sessionId;
	}

	/**
	 * Get trace ID
	 */
	public getTraceId(): string {
		return this.traceId;
	}

	// ===== Enhanced Logging Methods (from LoggingManager) =====

	/**
	 * Log user activity with enhanced context
	 */
	public logUserActivityEnhanced(userId: string, action: string, metadata?: Record<string, BasicValue>): void {
		if (!this.loggingConfig.enableUserActivityLogging) return;

		const context = {
			userId,
			action,
			...metadata,
		};

		this.logUserActivity(userId, action, context);
	}

	/**
	 * Log security events with enhanced context
	 */
	public logSecurityEventEnhanced(
		event: string,
		level: 'info' | 'warn' | 'error',
		metadata?: Record<string, BasicValue>
	): void {
		if (!this.loggingConfig.enableSecurityLogging) return;

		const context = {
			event,
			...metadata,
		};

		switch (level) {
			case 'info':
				this.securityLogin(event, context);
				break;
			case 'warn':
				this.securityDenied(event, context);
				break;
			case 'error':
				this.securityError(event, context);
				break;
		}
	}

	/**
	 * Log authentication events
	 */
	public logAuthenticationEnhanced(
		event: 'login' | 'logout' | 'register' | 'token_refresh' | 'password_reset',
		userId: string,
		username: string,
		metadata?: Record<string, BasicValue>
	): void {
		const context = {
			userId,
			username,
			event,
			...metadata,
		};

		this.securityLogin(`Authentication: ${event}`, context);
	}

	/**
	 * Log authorization events
	 */
	public logAuthorizationEnhanced(
		event: 'access_granted' | 'access_denied' | 'role_check' | 'permission_check',
		userId: string,
		resource: string,
		metadata?: Record<string, BasicValue>
	): void {
		const context = {
			userId,
			resource,
			event,
			...metadata,
		};

		if (event === 'access_denied') {
			this.securityDenied(`Authorization: ${event}`, context);
		} else {
			this.securityLogin(`Authorization: ${event}`, context);
		}
	}

	/**
	 * Log business events
	 */
	public logBusinessEventEnhanced(event: string, userId: string, metadata?: Record<string, BasicValue>): void {
		const context = {
			userId,
			event,
			...metadata,
		};

		this.businessInfo(event, context);
	}

	/**
	 * Log validation events
	 */
	public logValidationEnhanced(
		event: 'validation_start' | 'validation_success' | 'validation_failed' | 'validation_error',
		data: BasicValue | Record<string, unknown>,
		metadata?: Record<string, BasicValue>
	): void {
		const context = {
			data: typeof data === 'string' ? data.substring(0, 100) : data,
			event,
			...metadata,
		};

		const dataString = typeof data === 'string' ? data : JSON.stringify(data);

		switch (event) {
			case 'validation_start':
				this.validationDebug('validation_start', dataString, 'validation_manager', context);
				break;
			case 'validation_success':
				this.validationInfo('validation_success', dataString, 'validation_manager', context);
				break;
			case 'validation_failed':
				this.validationWarn('validation_failed', dataString, 'validation_manager', context);
				break;
			case 'validation_error':
				this.validationError('validation_error', dataString, 'validation_manager', context);
				break;
		}
	}

	/**
	 * Log cache events
	 */
	public logCacheEventEnhanced(
		event: 'hit' | 'miss' | 'set' | 'delete' | 'clear' | 'error',
		key: string,
		metadata?: Record<string, BasicValue>
	): void {
		const context = {
			key,
			event,
			...metadata,
		};

		switch (event) {
			case 'hit':
				this.cacheHit(key, context);
				break;
			case 'miss':
				this.cacheMiss(key, context);
				break;
			case 'set':
				this.cacheSet(key, context);
				break;
			case 'delete':
				this.cacheDelete(key, context);
				break;
			case 'clear':
				this.cacheClear();
				break;
			case 'error':
				this.cacheError('cache_error', key, context);
				break;
		}
	}

	/**
	 * Log database events
	 */
	public logDatabaseEventEnhanced(
		event: 'query' | 'transaction' | 'connection' | 'error',
		operation: string,
		metadata?: Record<string, BasicValue>
	): void {
		const context = {
			operation,
			event,
			...metadata,
		};

		this.databaseInfo(`Database: ${event}`, context);
	}

	/**
	 * Log error with enhanced context
	 */
	public logErrorEnhanced(error: Error | string, metadata?: Record<string, BasicValue>): void {
		const errorMessage = error instanceof Error ? error.message : error;
		const errorStack = error instanceof Error ? error.stack : undefined;

		const context = {
			error: errorMessage,
			stack: errorStack,
			...metadata,
		};

		this.error(errorMessage, context);
	}

	/**
	 * Update logging configuration
	 */
	public updateLoggingConfig(newConfig: Partial<typeof this.loggingConfig>): void {
		Object.assign(this.loggingConfig, newConfig);
		this.logInfo('Logging configuration updated', { config: this.loggingConfig });
	}

	/**
	 * Get current logging configuration
	 */
	public getLoggingConfig(): typeof this.loggingConfig {
		return { ...this.loggingConfig };
	}

	/**
	 * Check if logging level is enabled
	 */
	public isLoggingLevelEnabled(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
		const levels = ['debug', 'info', 'warn', 'error'];
		const currentLevelIndex = levels.indexOf(this.loggingConfig.logLevel || 'info');
		const requestedLevelIndex = levels.indexOf(level);

		return requestedLevelIndex >= currentLevelIndex;
	}

	// ===== Enhanced Performance Methods (from PerformanceManager) =====

	/**
	 * Track performance with enhanced metrics
	 */
	public trackPerformanceEnhanced(operation: string, startTime: number, metadata?: Record<string, BasicValue>): void {
		if (!this.loggingConfig.enablePerformanceLogging) return;

		const duration = Date.now() - startTime;

		// Store enhanced metric
		this.storePerformanceMetric(operation, {
			operation,
			duration,
			timestamp: new Date(),
			metadata,
		});

		// Update enhanced stats
		this.updatePerformanceStats(operation, duration);

		// Check thresholds
		this.checkPerformanceThresholds(operation, duration, metadata);

		// Log performance
		this.performance(operation, duration, metadata);
	}

	/**
	 * Track performance with async function
	 */
	public async trackAsyncEnhanced<T>(
		operation: string,
		fn: () => Promise<T>,
		metadata?: Record<string, BasicValue>
	): Promise<T> {
		const startTime = Date.now();

		try {
			const result = await fn();
			this.trackPerformanceEnhanced(operation, startTime, { ...metadata, success: true });
			return result;
		} catch (error) {
			this.trackPerformanceEnhanced(operation, startTime, {
				...metadata,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Track performance with sync function
	 */
	public trackSyncEnhanced<T>(operation: string, fn: () => T, metadata?: Record<string, BasicValue>): T {
		const startTime = Date.now();

		try {
			const result = fn();
			this.trackPerformanceEnhanced(operation, startTime, { ...metadata, success: true });
			return result;
		} catch (error) {
			this.trackPerformanceEnhanced(operation, startTime, {
				...metadata,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get enhanced performance stats for an operation
	 */
	public getPerformanceStatsEnhanced(operation?: string): Record<string, StatsValue> {
		if (operation) {
			const stats = this.performanceStats.get(operation);
			return stats ? { ...stats } : {};
		}
		return {};
	}

	/**
	 * Get all enhanced performance stats
	 */
	public getAllPerformanceStatsEnhanced(): Record<string, StatsValue> {
		const result: Record<string, StatsValue> = {};
		this.performanceStats.forEach((value, key) => {
			result[key] = value;
		});
		return result;
	}

	/**
	 * Get slow operations
	 */
	public getSlowOperationsEnhanced(threshold?: number): Array<{
		operation: string;
		duration: number;
		timestamp: Date;
		metadata?: Record<string, BasicValue>;
	}> {
		const slowThreshold = threshold || 1000;
		const slowOperations: Array<{
			operation: string;
			duration: number;
			timestamp: Date;
			metadata?: Record<string, BasicValue>;
		}> = [];

		for (const [operation, stats] of this.performanceStats) {
			if (stats.averageDuration > slowThreshold) {
				slowOperations.push({
					operation,
					duration: stats.averageDuration,
					timestamp: stats.lastUpdated,
				});
			}
		}

		return slowOperations.sort((a, b) => b.duration - a.duration);
	}

	/**
	 * Set performance threshold for an operation
	 */
	public setPerformanceThreshold(operation: string, threshold: number, unit: 'ms' | 's' = 'ms'): void {
		this.performanceThresholds[operation] = unit === 's' ? threshold * 1000 : threshold;
		this.logInfo(`Performance threshold set for ${operation}: ${threshold}${unit}`);
	}

	/**
	 * Get performance threshold for an operation
	 */
	public getPerformanceThreshold(operation: string): number {
		return this.performanceThresholds[operation] || 1000; // Default threshold
	}

	/**
	 * Check if operation exceeds threshold
	 */
	public exceedsPerformanceThreshold(operation: string, duration: number): boolean {
		const threshold = this.performanceThresholds[operation];
		if (!threshold) return false;

		return duration > threshold;
	}

	/**
	 * Get performance summary
	 */
	public getPerformanceSummaryEnhanced(): {
		totalOperations: number;
		averageDuration: number;
		slowOperations: number;
		errorCount: number;
		topSlowOperations: Array<{ operation: string; averageDuration: number }>;
	} {
		let totalOperations = 0;
		let totalDuration = 0;
		let slowOperations = 0;
		let errorCount = 0;
		const operationAverages: Array<{ operation: string; averageDuration: number }> = [];

		for (const [operation, stats] of this.performanceStats) {
			totalOperations += stats.totalOperations;
			totalDuration += stats.averageDuration * stats.totalOperations;
			slowOperations += stats.slowOperations;
			errorCount += stats.errorCount;

			operationAverages.push({
				operation,
				averageDuration: stats.averageDuration,
			});
		}

		const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
		const topSlowOperations = operationAverages.sort((a, b) => b.averageDuration - a.averageDuration).slice(0, 10);

		return {
			totalOperations,
			averageDuration,
			slowOperations,
			errorCount,
			topSlowOperations,
		};
	}

	/**
	 * Clear enhanced performance data
	 */
	public clearPerformanceDataEnhanced(): void {
		this.performanceStats.clear();
		this.performanceThresholds = {};
		this.logInfo('Enhanced performance data cleared');
	}

	/**
	 * Clear enhanced performance data for specific operation
	 */
	public clearOperationPerformanceDataEnhanced(operation: string): void {
		this.performanceStats.delete(operation);
		delete this.performanceThresholds[operation];
		this.logInfo(`Enhanced performance data cleared for operation: ${operation}`);
	}

	// ===== Private Helper Methods =====

	/**
	 * Initialize performance thresholds
	 */
	private initializePerformanceThresholds(): void {
		const defaultThresholds = [
			{ operation: 'database_query', threshold: 500, unit: 'ms' as const },
			{ operation: 'api_request', threshold: 1000, unit: 'ms' as const },
			{ operation: 'cache_operation', threshold: 100, unit: 'ms' as const },
			{ operation: 'validation', threshold: 200, unit: 'ms' as const },
		];

		for (const threshold of defaultThresholds) {
			this.performanceThresholds[threshold.operation] = threshold.threshold;
		}
	}

	/**
	 * Store enhanced performance metric
	 */
	private storePerformanceMetric(
		operation: string,
		metric: {
			operation: string;
			duration: number;
			timestamp: Date;
			metadata?: Record<string, BasicValue>;
		}
	): void {
		// Store in existing performanceMetrics for backward compatibility
		const key = `${operation}_${Date.now()}`;
		this.performanceMetrics.set(key, {
			startTime: metric.timestamp.getTime() - metric.duration,
			endTime: metric.timestamp.getTime(),
			duration: metric.duration,
		});
	}

	/**
	 * Update enhanced performance stats
	 */
	private updatePerformanceStats(operation: string, duration: number): void {
		if (!this.performanceStats.has(operation)) {
			this.performanceStats.set(operation, {
				totalOperations: 0,
				averageDuration: 0,
				minDuration: Infinity,
				maxDuration: 0,
				slowOperations: 0,
				errorCount: 0,
				lastUpdated: new Date(),
			});
		}

		const stats = this.performanceStats.get(operation)!;
		stats.totalOperations++;
		stats.averageDuration = (stats.averageDuration * (stats.totalOperations - 1) + duration) / stats.totalOperations;
		stats.minDuration = Math.min(stats.minDuration, duration);
		stats.maxDuration = Math.max(stats.maxDuration, duration);
		stats.lastUpdated = new Date();

		// Check if it's a slow operation
		if (this.exceedsPerformanceThreshold(operation, duration)) {
			stats.slowOperations++;
		}

		// Check if it's an error (duration < 0 indicates error)
		if (duration < 0) {
			stats.errorCount++;
		}
	}

	/**
	 * Check performance thresholds
	 */
	private checkPerformanceThresholds(operation: string, duration: number, metadata?: Record<string, BasicValue>): void {
		if (this.exceedsPerformanceThreshold(operation, duration)) {
			const threshold = this.performanceThresholds[operation];
			this.performance(`Performance threshold exceeded`, duration, {
				operation,
				threshold,
				metadata,
			});
		}
	}
}

// Export singleton instance
export const serverLogger = new ServerLogger();

// Export factory function for custom configurations
export const createServerLogger = (config?: LoggerConfigUpdate) => new ServerLogger(config);
