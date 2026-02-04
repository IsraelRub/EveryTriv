import { StorageType, TIME_PERIODS_MS } from '@shared/constants';
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
				totalItems: 0,
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
		const ops = this.metrics.operations;
		const errors = this.metrics.errors;
		switch (operation) {
			case 'get':
			case 'set':
			case 'delete':
			case 'clear':
				ops[operation]++;
				if (!success) errors.total++;
				break;
			case 'exists':
				ops.exists!++;
				if (!success) errors.exists!++;
				break;
			case 'getKeys':
				ops.getKeys!++;
				if (!success) errors.getKeys!++;
				break;
			case 'invalidate':
				ops.invalidate!++;
				if (!success) errors.invalidate!++;
				break;
			case 'getOrSet':
				ops.getOrSet!++;
				if (!success) errors.getOrSet!++;
				break;
			case 'getStats':
				ops.getStats!++;
				if (!success) errors.getStats!++;
				break;
			case 'cleanup':
				ops.cleanup!++;
				if (!success) errors.cleanup!++;
				break;
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
		if (hit) this.metrics.performance.hitRate!++;
		else this.metrics.performance.missRate!++;
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
			if (duration > TIME_PERIODS_MS.SECOND) {
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
				slowOperations: duration > TIME_PERIODS_MS.SECOND ? 1 : 0,
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
				totalItems: 0,
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
		const errors = this.metrics.errors;
		let total = 0;
		let errorCount = 0;
		switch (operation) {
			case 'get':
			case 'set':
			case 'delete':
			case 'clear':
				total = ops[operation];
				errorCount = errors.total;
				break;
			case 'exists':
				total = ops.exists ?? 0;
				errorCount = errors.exists ?? errors.total;
				break;
			case 'getKeys':
				total = ops.getKeys ?? 0;
				errorCount = errors.getKeys ?? errors.total;
				break;
			case 'invalidate':
				total = ops.invalidate ?? 0;
				errorCount = errors.invalidate ?? errors.total;
				break;
			case 'getOrSet':
				total = ops.getOrSet ?? 0;
				errorCount = errors.getOrSet ?? errors.total;
				break;
			case 'getStats':
				total = ops.getStats ?? 0;
				errorCount = errors.getStats ?? errors.total;
				break;
			case 'cleanup':
				total = ops.cleanup ?? 0;
				errorCount = errors.cleanup ?? errors.total;
				break;
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
			seconds: Math.floor(uptime / TIME_PERIODS_MS.SECOND),
			minutes: Math.floor(uptime / TIME_PERIODS_MS.MINUTE),
			hours: Math.floor(uptime / TIME_PERIODS_MS.HOUR),
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
		this.metrics.performance.opsPerSecond = uptime > 0 ? totalOps / (uptime / TIME_PERIODS_MS.SECOND) : 0;
	}

	/** Log-only; request/endpoint/method/slow/error data is not persisted to getMetrics(). */
	trackRequestPerformance(endpoint: string, duration: number, metadata?: Record<string, BasicValue>): void {
		logger.performance('Request tracking', duration, { endpoint, ...metadata });
	}

	trackEndpointPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		const duration = typeof metadata?.duration === 'number' ? metadata.duration : 0;
		logger.performance('Endpoint tracking', duration, { endpoint, ...metadata });
	}

	trackMethodPerformance(method: string, metadata?: Record<string, StatsValue>): void {
		const duration = typeof metadata?.duration === 'number' ? metadata.duration : 0;
		logger.performance('Method tracking', duration, { method, ...metadata });
	}

	trackSlowRequest(endpoint: string, metadata?: Record<string, StatsValue>): void {
		const duration = typeof metadata?.duration === 'number' ? metadata.duration : 0;
		logger.performance('Slow request tracking', duration, { endpoint, ...metadata });
	}

	trackErrorPerformance(endpoint: string, metadata?: Record<string, StatsValue>): void {
		const duration = typeof metadata?.duration === 'number' ? metadata.duration : 0;
		logger.performance('Error performance tracking', duration, { endpoint, ...metadata });
	}
}

export const metricsService = MetricsService.getInstance();
