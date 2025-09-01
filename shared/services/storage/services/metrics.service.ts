/**
 * Unified metrics service for storage operations
 *
 * @module MetricsService
 * @description Centralized metrics tracking for all storage operations
 * @used_by server/src/shared/modules/storage/storage.service.ts, server/src/shared/modules/cache/cache.service.ts, client/src/services/storage/storage.service.ts
 */
import { StorageMetrics } from '../../../types/storage.types';

/**
 * Unified metrics service class
 * @class MetricsService
 * @description Centralized metrics tracking for storage operations
 */
export class MetricsService {
	private static instance: MetricsService;
	private metrics: StorageMetrics;
	private startTime: Date;
	private operationTimes: Map<keyof StorageMetrics['operations'], number[]> = new Map();

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
		this.operationTimes.get(operation)!.push(duration);

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
	 * Get current metrics
	 * @returns Current metrics
	 */
	getMetrics(): StorageMetrics {
		this.updateUptime();
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
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
