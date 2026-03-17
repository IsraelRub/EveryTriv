import { StorageType, TIME_PERIODS_MS } from '@shared/constants';
import type { MiddlewareMetrics, StatsValue } from '@shared/types';
import { calculatePercentage, getErrorType, mean, sumBy } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { PERFORMANCE_TRACKING } from '@internal/constants';
import type { StorageMetrics } from '@internal/types';

import { serverLogger as logger } from '../logging';

function createStorageTypesMetrics(): Record<StorageType, { operations: number; errors: number; size: number }> {
	return {
		[StorageType.PERSISTENT]: { operations: 0, errors: 0, size: 0 },
		[StorageType.CACHE]: { operations: 0, errors: 0, size: 0 },
	};
}

export class MetricsService {
	private metrics: StorageMetrics;
	private startTime: Date;
	private operationTimes: Map<keyof StorageMetrics['operations'], number[]> = new Map();
	private middlewareMetrics: Map<string, MiddlewareMetrics> = new Map();

	constructor() {
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
				ops.exists = (ops.exists ?? 0) + 1;
				if (!success) errors.exists = (errors.exists ?? 0) + 1;
				break;
			case 'getKeys':
				ops.getKeys = (ops.getKeys ?? 0) + 1;
				if (!success) errors.getKeys = (errors.getKeys ?? 0) + 1;
				break;
			case 'invalidate':
				ops.invalidate = (ops.invalidate ?? 0) + 1;
				if (!success) errors.invalidate = (errors.invalidate ?? 0) + 1;
				break;
			case 'getOrSet':
				ops.getOrSet = (ops.getOrSet ?? 0) + 1;
				if (!success) errors.getOrSet = (errors.getOrSet ?? 0) + 1;
				break;
			case 'getStats':
				ops.getStats = (ops.getStats ?? 0) + 1;
				if (!success) errors.getStats = (errors.getStats ?? 0) + 1;
				break;
			case 'cleanup':
				ops.cleanup = (ops.cleanup ?? 0) + 1;
				if (!success) errors.cleanup = (errors.cleanup ?? 0) + 1;
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
		if (hit) this.metrics.performance.hitRate = (this.metrics.performance.hitRate ?? 0) + 1;
		else this.metrics.performance.missRate = (this.metrics.performance.missRate ?? 0) + 1;
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

	getOverallSuccessRate(): number {
		const totalOps = sumBy(Object.values(this.metrics.operations), count => (VALIDATORS.number(count) ? count : 0));
		const totalErrors = this.metrics.errors.total ?? 0;
		return totalOps > 0 ? calculatePercentage(totalOps - totalErrors, totalOps) : 100;
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
			this.metrics.performance.averageGetTime = mean(getTimes);
		}
		if (setTimes.length > 0) {
			this.metrics.performance.averageSetTime = mean(setTimes);
		}
		if (deleteTimes.length > 0) {
			this.metrics.performance.averageDeleteTime = mean(deleteTimes);
		}

		// Calculate average response time across all operations
		const allTimes: number[] = [];
		this.operationTimes.forEach(times => {
			allTimes.push(...times);
		});

		if (allTimes.length > 0) {
			this.metrics.performance.avgResponseTime = mean(allTimes);
		}

		// Calculate operations per second
		const uptime = Date.now() - this.startTime.getTime();
		const totalOps = sumBy(Object.values(this.metrics.operations), count => (VALIDATORS.number(count) ? count : 0));
		this.metrics.performance.opsPerSecond = uptime > 0 ? totalOps / (uptime / TIME_PERIODS_MS.SECOND) : 0;
	}

	trackPerformance(
		kind: keyof typeof PERFORMANCE_TRACKING,
		target: string,
		metadata?: Record<string, StatsValue>
	): void {
		const duration = VALIDATORS.number(metadata?.duration) ? metadata.duration : 0;
		const message = PERFORMANCE_TRACKING[kind];
		const payload = kind === 'method' ? { method: target, ...metadata } : { endpoint: target, ...metadata };
		logger.performance(message, duration, payload);
	}
}

export const metricsService = new MetricsService();
