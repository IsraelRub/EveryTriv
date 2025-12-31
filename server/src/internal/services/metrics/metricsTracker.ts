/**
 * Storage Metrics Tracker
 *
 * @module StorageMetricsTracker
 * @description metrics tracking for all storage operations
 */
import { StorageType } from '@shared/constants';
import type { StorageMetrics } from '@shared/types';
import { metricsService } from './metrics.service';
import { calculateDuration } from '@shared/utils';

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
		storageType: StorageType = StorageType.PERSISTENT,
		size?: number,
		enableMetrics: boolean = true
	): void {
		if (!enableMetrics) {
			return;
		}

		const duration = calculateDuration(startTime);
		metricsService.trackOperation(operation, storageType, success, duration, size);
	}
}
