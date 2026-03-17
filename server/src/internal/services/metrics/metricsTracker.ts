import { StorageType } from '@shared/constants';
import { calculateDuration } from '@shared/utils';

import type { StorageMetrics } from '@internal/types';

import { metricsService } from './metrics.service';

export class StorageMetricsTracker {
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
