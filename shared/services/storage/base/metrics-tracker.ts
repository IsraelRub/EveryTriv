/**
 * Storage Metrics Tracker
 *
 * @module StorageMetricsTracker
 * @description metrics tracking for all storage operations
 * @used_by shared/services/storage/services/baseStorage.service.ts, shared/services/storage
 */
import { StorageMetrics } from '../../../types/infrastructure/storage.types';
import { metricsService } from '../services/metrics.service';

/**
 * Storage Metrics Tracker
 * @class StorageMetricsTracker
 * @description Centralized metrics tracking for storage operations
 */
export class StorageMetricsTracker {
	/**
	 * Track storage operation with timing
	 * @param operation Operation name
	 * @param startTime Operation start time
	 * @param success Whether operation was successful
	 * @param storageType Storage type
	 * @param size Data size in bytes (optional)
	 * @param enableMetrics Whether to enable metrics tracking
	 */
	static trackOperation(
		operation: keyof StorageMetrics['operations'],
		startTime: number,
		success: boolean,
		storageType: 'persistent' | 'cache' | 'hybrid' = 'hybrid',
		size?: number,
		enableMetrics: boolean = true
	): void {
		if (!enableMetrics) {
			return;
		}

		const duration = Date.now() - startTime;
		metricsService.trackOperation(operation, storageType, success, duration, size);
	}
}
