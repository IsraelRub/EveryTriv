/**
 * metrics service for storage operations
 *
 * @module MetricsService
 * @description Centralized metrics tracking for all storage operations
 */
import { serverLogger as logger } from '@shared/services';
import type { BasicValue, MiddlewareMetrics, StatsValue, StorageMetrics } from '@shared/types';

/**
 * metrics service class
 * @class MetricsService
 * @description Centralized metrics tracking for storage operations
 */
export class MetricsService {
	private static instance: MetricsService;
	private metrics: StorageMetrics;
	private startTime: Date;
	private operationTimes: Map<keyof StorageMetrics['operations'], number[]> = new Map();
	private middlewareMetrics: Map<string, MiddlewareMetrics> = new Map();

	private constructor() {
		this.startTime = new Date();
		this.metrics = {
			operations: {
				set: 0,
				get: 0,
				delete: 0,
				exists: 0,
				clear: 0,
				getKeys: 0,
				invalidate: 0,
				getOrSet: 0,
				getStats: 0,
				cleanup: 0,
			},
			errors: {
				set: 0,
				get: 0,
				delete: 0,
				exists: 0,
				clear: 0,
				getKeys: 0,
				invalidate: 0,
				getOrSet: 0,
				getStats: 0,
				cleanup: 0,
			},
			performance: {
				avgResponseTime: 0,
				opsPerSecond: 0,
				hitRate: 0,
				missRate: 0,
			},
			storageTypes: {
				persistent: { operations: 0, errors: 0, size: 0 },
				cache: { operations: 0, errors: 0, size: 0 },
				hybrid: { operations: 0, errors: 0, size: 0 },
			},
			uptime: {
				ms: 0,
				seconds: 0,
				minutes: 0,
				hours: 0,
			},
			totalOps: 0,
			totalErrors: 0,
			middleware: {},
		};
	}

	/**
	 * Get singleton instance
	 * @returns MetricsService instance
	 */
	static getInstance(): MetricsService {
		if (!MetricsService.instance) {
			MetricsService.instance = new MetricsService();
		}
		return MetricsService.instance;
	}

	/**
	 * Track operation
	 * @param operation Operation name
	 * @param storageType Storage type
	 * @param success Whether operation was successful
	 * @param duration Operation duration in milliseconds
	 * @param size Data size in bytes (optional)
	 */
	trackOperation(
		operation: keyof StorageMetrics['operations'],
		storageType: 'persistent' | 'cache' | 'hybrid',
		success: boolean,
		duration: number,
		size?: number
	): void {
		// Track operation count
		this.metrics.operations[operation]++;

		// Track error count
		if (!success) {
			this.metrics.errors[operation]++;
		}

		// Track storage type metrics
		this.metrics.storageTypes[storageType].operations++;
		if (!success) {
			this.metrics.storageTypes[storageType].errors++;
		}
		if (size) {
			this.metrics.storageTypes[storageType].size += size;
		}

		// Track operation times for performance calculation
		if (!this.operationTimes.has(operation)) {
			this.operationTimes.set(operation, []);
		}
		const times = this.operationTimes.get(operation);
		if (times) {
			times.push(duration);
		}

		// Update performance metrics
		this.updatePerformanceMetrics();
	}

	/**
	 * Track cache hit/miss
	 * @param hit Whether it was a cache hit
	 */
	trackCacheHit(hit: boolean): void {
		// This would be called by cache services to track hit/miss rates
		// Implementation depends on how you want to track this
		if (hit) {
			this.metrics.performance.hitRate++;
		} else {
			this.metrics.performance.missRate++;
		}
	}

	/**
	 * Track middleware execution metrics
	 * @param middlewareName Middleware name
	 * @param duration Execution duration in milliseconds
	 * @param success Whether execution was successful
	 * @param error Error object if execution failed
	 */
	trackMiddlewareExecution(middlewareName: string, duration: number, success: boolean = true, error?: Error): void {
		const existing = this.middlewareMetrics.get(middlewareName);
		const now = new Date();

		if (existing) {
			// Update existing metrics
			existing.requestCount++;
			existing.totalDuration += duration;
			existing.averageDuration = existing.totalDuration / existing.requestCount;
			existing.minDuration = Math.min(existing.minDuration, duration);
			existing.maxDuration = Math.max(existing.maxDuration, duration);
			existing.lastExecuted = now;

			// Update slow operations count
			if (duration > 1000) {
				existing.slowOperations++;
			}

			if (!success) {
				existing.errorCount++;
				if (error) {
					existing.lastErrorMessage = error.message;
					existing.lastErrorName = error.name;
					existing.lastErrorTimestamp = now;
				}
			}
		} else {
			// Create new metrics entry
			this.middlewareMetrics.set(middlewareName, {
				requestCount: 1,
				totalDuration: duration,
				averageDuration: duration,
				minDuration: duration,
				maxDuration: duration,
				slowOperations: duration > 1000 ? 1 : 0, // Consider operations > 1s as slow
				errorCount: success ? 0 : 1,
				lastExecuted: now,
				lastErrorMessage: !success && error ? error.message : undefined,
				lastErrorName: !success && error ? error.name : undefined,
				lastErrorTimestamp: !success && error ? now : undefined,
			});
		}

		// Update metrics object
		this.updateMiddlewareMetrics();
	}

	/**
	 * Get middleware metrics
	 * @param middlewareName Optional middleware name to get specific metrics
	 * @returns Middleware metrics
	 */
	getMiddlewareMetrics(middlewareName?: string): Record<string, MiddlewareMetrics> | MiddlewareMetrics | null {
		if (middlewareName) {
			return this.middlewareMetrics.get(middlewareName) || null;
		}

		const middlewareObj: Record<string, MiddlewareMetrics> = {};
		this.middlewareMetrics.forEach((metrics, name) => {
			middlewareObj[name] = { ...metrics };
		});
		return middlewareObj;
	}

	/**
	 * Reset middleware metrics
	 * @param middlewareName Optional middleware name to reset specific metrics
	 */
	resetMiddlewareMetrics(middlewareName?: string): void {
		if (middlewareName) {
			this.middlewareMetrics.delete(middlewareName);
		} else {
			this.middlewareMetrics.clear();
		}
		this.updateMiddlewareMetrics();
	}

	/**
	 * Get current metrics
	 * @returns Current metrics
	 */
	getMetrics(): StorageMetrics {
		this.updateUptime();
		this.updateMiddlewareMetrics();
		return { ...this.metrics };
	}

	/**
	 * Reset metrics
	 */
	resetMetrics(): void {
		this.startTime = new Date();
		this.metrics = {
			operations: {
				set: 0,
				get: 0,
				delete: 0,
				exists: 0,
				clear: 0,
				getKeys: 0,
				invalidate: 0,
				getOrSet: 0,
				getStats: 0,
				cleanup: 0,
			},
			errors: {
				set: 0,
				get: 0,
				delete: 0,
				exists: 0,
				clear: 0,
				getKeys: 0,
				invalidate: 0,
				getOrSet: 0,
				getStats: 0,
				cleanup: 0,
			},
			performance: {
				avgResponseTime: 0,
				opsPerSecond: 0,
				hitRate: 0,
				missRate: 0,
			},
			storageTypes: {
				persistent: { operations: 0, errors: 0, size: 0 },
				cache: { operations: 0, errors: 0, size: 0 },
				hybrid: { operations: 0, errors: 0, size: 0 },
			},
			uptime: {
				ms: 0,
				seconds: 0,
				minutes: 0,
				hours: 0,
			},
			totalOps: 0,
			totalErrors: 0,
		};
		this.operationTimes.clear();
	}

	/**
	 * Get success rate for operation
	 * @param operation Operation name
	 * @returns Success rate percentage
	 */
	getSuccessRate(operation: keyof StorageMetrics['operations']): number {
		const total = this.metrics.operations[operation];
		const errors = this.metrics.errors[operation];
		return total > 0 ? ((total - errors) / total) * 100 : 100;
	}

	/**
	 * Get overall success rate
	 * @returns Overall success rate percentage
	 */
	getOverallSuccessRate(): number {
		const totalOps = Object.values(this.metrics.operations).reduce((sum: number, count: number) => sum + count, 0);
		const totalErrors = Object.values(this.metrics.errors).reduce((sum: number, count: number) => sum + count, 0);
		return totalOps > 0 ? ((totalOps - totalErrors) / totalOps) * 100 : 100;
	}

	/**
	 * Update uptime metrics
	 */
	private updateUptime(): void {
		const uptime = Date.now() - this.startTime.getTime();
		this.metrics.uptime = {
			ms: uptime,
			seconds: Math.floor(uptime / 1000),
			minutes: Math.floor(uptime / 60000),
			hours: Math.floor(uptime / 3600000),
		};
	}

	/**
	 * Update middleware metrics in main metrics object
	 */
	private updateMiddlewareMetrics(): void {
		const middlewareObj: typeof this.metrics.middleware = {};
		this.middlewareMetrics.forEach((metrics, name) => {
			middlewareObj[name] = { ...metrics };
		});
		this.metrics.middleware = middlewareObj;
	}

	/**
	 * Update performance metrics
	 */
	private updatePerformanceMetrics(): void {
		// Calculate average response time
		const allTimes: number[] = [];
		this.operationTimes.forEach(times => {
			allTimes.push(...times);
		});

		if (allTimes.length > 0) {
			this.metrics.performance.avgResponseTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
		}

		// Calculate operations per second
		const uptime = Date.now() - this.startTime.getTime();
		const totalOps = Object.values(this.metrics.operations).reduce((sum: number, count: number) => sum + count, 0);
		this.metrics.performance.opsPerSecond = uptime > 0 ? totalOps / (uptime / 1000) : 0;
	}

	/**
	 * Track request performance
	 * @param endpoint - The endpoint being tracked
	 * @param duration - Duration in milliseconds
	 * @param metadata - Additional metadata
	 */
	trackRequestPerformance(endpoint: string, duration: number, metadata?: Record<string, BasicValue>): void {
		// Implementation for request performance tracking
		logger.performance('Request tracking', duration, { endpoint, ...metadata });
	}

	/**
	 * Track endpoint performance
	 * @param endpoint - The endpoint being tracked
	 * @param metadata - Additional metadata
	 */
	trackEndpointPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for endpoint performance tracking
		logger.performance('Endpoint tracking', 0, { endpoint, ...metadata });
	}

	/**
	 * Track method performance
	 * @param method - The method being tracked
	 * @param metadata - Additional metadata
	 */
	trackMethodPerformance(method: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for method performance tracking
		logger.performance('Method tracking', 0, { method, ...metadata });
	}

	/**
	 * Track slow request
	 * @param endpoint - The endpoint being tracked
	 * @param metadata - Additional metadata
	 */
	trackSlowRequest(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for slow request tracking
		logger.performance('Slow request tracking', 0, { endpoint, ...metadata });
	}

	/**
	 * Track error performance
	 * @param endpoint - The endpoint being tracked
	 * @param metadata - Additional metadata
	 */
	trackErrorPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for error performance tracking
		logger.performance('Error performance tracking', 0, { endpoint, ...metadata });
	}
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
