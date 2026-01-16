import { StorageType } from '@shared/constants';
import type { BasicValue, MiddlewareMetrics, StatsValue, StorageMetrics } from '@shared/types';
import { getErrorType } from '@shared/utils';

import { serverLogger as logger } from '../logging';

function createStorageTypesMetrics(): Record<StorageType, { operations: number; errors: number; size: number }> {
	return {
		[StorageType.PERSISTENT]: { operations: 0, errors: 0, size: 0 },
		[StorageType.CACHE]: { operations: 0, errors: 0, size: 0 },
	};
}

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
				total: 0,
				byType: {},
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
				averageGetTime: 0,
				averageSetTime: 0,
				averageDeleteTime: 0,
				avgResponseTime: 0,
				opsPerSecond: 0,
				hitRate: 0,
				missRate: 0,
			},
			storage: {
				totalSize: 0,
				itemCount: 0,
				hitRate: 0,
				missRate: 0,
			},
			storageTypes: createStorageTypesMetrics(),
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

	static getInstance(): MetricsService {
		if (!MetricsService.instance) {
			MetricsService.instance = new MetricsService();
		}
		return MetricsService.instance;
	}

	trackOperation(
		operation: keyof StorageMetrics['operations'],
		storageType: StorageType,
		success: boolean,
		duration: number,
		size?: number
	): void {
		// Track operation count
		const ops = this.metrics.operations;
		if (operation === 'get' || operation === 'set' || operation === 'delete' || operation === 'clear') {
			ops[operation]++;
		} else if (operation === 'exists' && ops.exists != null) {
			ops.exists++;
		} else if (operation === 'getKeys' && ops.getKeys != null) {
			ops.getKeys++;
		} else if (operation === 'invalidate' && ops.invalidate != null) {
			ops.invalidate++;
		} else if (operation === 'getOrSet' && ops.getOrSet != null) {
			ops.getOrSet++;
		} else if (operation === 'getStats' && ops.getStats != null) {
			ops.getStats++;
		} else if (operation === 'cleanup' && ops.cleanup != null) {
			ops.cleanup++;
		}

		// Track error count
		if (!success) {
			const errors = this.metrics.errors;
			if (operation === 'get' || operation === 'set' || operation === 'delete' || operation === 'clear') {
				// These are not in errors object, only total and byType
				errors.total++;
			} else if (operation === 'exists' && errors.exists != null) {
				errors.exists++;
			} else if (operation === 'getKeys' && errors.getKeys != null) {
				errors.getKeys++;
			} else if (operation === 'invalidate' && errors.invalidate != null) {
				errors.invalidate++;
			} else if (operation === 'getOrSet' && errors.getOrSet != null) {
				errors.getOrSet++;
			} else if (operation === 'getStats' && errors.getStats != null) {
				errors.getStats++;
			} else if (operation === 'cleanup' && errors.cleanup != null) {
				errors.cleanup++;
			} else {
				errors.total++;
			}
		}

		// Track storage type metrics
		if (this.metrics.storageTypes) {
			if (!this.metrics.storageTypes[storageType]) {
				this.metrics.storageTypes[storageType] = {
					operations: 0,
					errors: 0,
					size: 0,
				};
			}
			this.metrics.storageTypes[storageType].operations++;
			if (!success) {
				this.metrics.storageTypes[storageType].errors++;
			}
			if (size) {
				this.metrics.storageTypes[storageType].size += size;
			}
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

	trackCacheHit(hit: boolean): void {
		// This would be called by cache services to track hit/miss rates
		// Implementation depends on how you want to track this
		if (this.metrics.performance.hitRate != null && this.metrics.performance.missRate != null) {
			if (hit) {
				this.metrics.performance.hitRate++;
			} else {
				this.metrics.performance.missRate++;
			}
		}
	}

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
					existing.lastErrorName = getErrorType(error);
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
				lastErrorName: !success && error ? getErrorType(error) : undefined,
				lastErrorTimestamp: !success && error ? now : undefined,
			});
		}

		// Update metrics object
		this.updateMiddlewareMetrics();
	}

	getMiddlewareMetrics(middlewareName?: string): Record<string, MiddlewareMetrics> | MiddlewareMetrics | null {
		if (middlewareName) {
			return this.middlewareMetrics.get(middlewareName) ?? null;
		}

		const middlewareObj: Record<string, MiddlewareMetrics> = {};
		this.middlewareMetrics.forEach((metrics, name) => {
			middlewareObj[name] = { ...metrics };
		});
		return middlewareObj;
	}

	resetMiddlewareMetrics(middlewareName?: string): void {
		if (middlewareName) {
			this.middlewareMetrics.delete(middlewareName);
		} else {
			this.middlewareMetrics.clear();
		}
		this.updateMiddlewareMetrics();
	}

	getMetrics(): StorageMetrics {
		this.updateUptime();
		this.updateMiddlewareMetrics();
		return { ...this.metrics };
	}

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
				total: 0,
				byType: {},
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
				averageGetTime: 0,
				averageSetTime: 0,
				averageDeleteTime: 0,
				avgResponseTime: 0,
				opsPerSecond: 0,
				hitRate: 0,
				missRate: 0,
			},
			storage: {
				totalSize: 0,
				itemCount: 0,
				hitRate: 0,
				missRate: 0,
			},
			storageTypes: createStorageTypesMetrics(),
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

	getSuccessRate(operation: keyof StorageMetrics['operations']): number {
		const ops = this.metrics.operations;
		let total = 0;
		if (operation === 'get' || operation === 'set' || operation === 'delete' || operation === 'clear') {
			total = ops[operation];
		} else if (operation === 'exists') {
			total = ops.exists ?? 0;
		} else if (operation === 'getKeys') {
			total = ops.getKeys ?? 0;
		} else if (operation === 'invalidate') {
			total = ops.invalidate ?? 0;
		} else if (operation === 'getOrSet') {
			total = ops.getOrSet ?? 0;
		} else if (operation === 'getStats') {
			total = ops.getStats ?? 0;
		} else if (operation === 'cleanup') {
			total = ops.cleanup ?? 0;
		}

		const errors = this.metrics.errors;
		let errorCount = 0;
		if (operation === 'get' || operation === 'set' || operation === 'delete' || operation === 'clear') {
			errorCount = errors.total;
		} else if (operation === 'exists' && errors.exists != null) {
			errorCount = errors.exists;
		} else if (operation === 'getKeys' && errors.getKeys != null) {
			errorCount = errors.getKeys;
		} else if (operation === 'invalidate' && errors.invalidate != null) {
			errorCount = errors.invalidate;
		} else if (operation === 'getOrSet' && errors.getOrSet != null) {
			errorCount = errors.getOrSet;
		} else if (operation === 'getStats' && errors.getStats != null) {
			errorCount = errors.getStats;
		} else if (operation === 'cleanup' && errors.cleanup != null) {
			errorCount = errors.cleanup;
		} else {
			errorCount = errors.total;
		}

		return total > 0 ? ((total - errorCount) / total) * 100 : 100;
	}

	getOverallSuccessRate(): number {
		const totalOps = Object.values(this.metrics.operations).reduce((sum: number, count: unknown) => {
			return sum + (typeof count === 'number' ? count : 0);
		}, 0);
		const totalErrors = this.metrics.errors.total ?? 0;
		return totalOps > 0 ? ((totalOps - totalErrors) / totalOps) * 100 : 100;
	}

	private updateUptime(): void {
		const uptime = Date.now() - this.startTime.getTime();
		this.metrics.uptime = {
			ms: uptime,
			seconds: Math.floor(uptime / 1000),
			minutes: Math.floor(uptime / 60000),
			hours: Math.floor(uptime / 3600000),
		};
	}

	private updateMiddlewareMetrics(): void {
		const middlewareObj: typeof this.metrics.middleware = {};
		this.middlewareMetrics.forEach((metrics, name) => {
			middlewareObj[name] = { ...metrics };
		});
		this.metrics.middleware = middlewareObj;
	}

	private updatePerformanceMetrics(): void {
		// Calculate average times for specific operations
		const getTimes = this.operationTimes.get('get') ?? [];
		const setTimes = this.operationTimes.get('set') ?? [];
		const deleteTimes = this.operationTimes.get('delete') ?? [];

		if (getTimes.length > 0) {
			this.metrics.performance.averageGetTime = getTimes.reduce((sum, time) => sum + time, 0) / getTimes.length;
		}
		if (setTimes.length > 0) {
			this.metrics.performance.averageSetTime = setTimes.reduce((sum, time) => sum + time, 0) / setTimes.length;
		}
		if (deleteTimes.length > 0) {
			this.metrics.performance.averageDeleteTime =
				deleteTimes.reduce((sum, time) => sum + time, 0) / deleteTimes.length;
		}

		// Calculate average response time across all operations
		const allTimes: number[] = [];
		this.operationTimes.forEach(times => {
			allTimes.push(...times);
		});

		if (allTimes.length > 0) {
			this.metrics.performance.avgResponseTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
		}

		// Calculate operations per second
		const uptime = Date.now() - this.startTime.getTime();
		const totalOps = Object.values(this.metrics.operations).reduce((sum: number, count: unknown) => {
			return sum + (typeof count === 'number' ? count : 0);
		}, 0);
		this.metrics.performance.opsPerSecond = uptime > 0 ? totalOps / (uptime / 1000) : 0;
	}

	trackRequestPerformance(endpoint: string, duration: number, metadata?: Record<string, BasicValue>): void {
		// Implementation for request performance tracking
		logger.performance('Request tracking', duration, { endpoint, ...metadata });
	}

	trackEndpointPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for endpoint performance tracking
		logger.performance('Endpoint tracking', 0, { endpoint, ...metadata });
	}

	trackMethodPerformance(method: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for method performance tracking
		logger.performance('Method tracking', 0, { method, ...metadata });
	}

	trackSlowRequest(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for slow request tracking
		logger.performance('Slow request tracking', 0, { endpoint, ...metadata });
	}

	trackErrorPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		// Implementation for error performance tracking
		logger.performance('Error performance tracking', 0, {
			endpoint,
			...metadata,
		});
	}
}

export const metricsService = MetricsService.getInstance();
