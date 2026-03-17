import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

import { ErrorCode, TIME_DURATIONS_SECONDS, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { Cache, Public, Roles } from '@common/decorators';
import { CacheService } from '@internal/modules';
import { serverLogger as logger, MetricsService } from '@internal/services';
import { createStorageError } from '@internal/utils';

import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
	constructor(
		private readonly storageService: StorageService,
		private readonly cacheService: CacheService,
		private readonly metricsService: MetricsService
	) {}

	@Get('metrics')
	@Public()
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getMetrics() {
		try {
			const metrics = this.metricsService.getMetrics();
			const [storageResult, cacheResult] = await Promise.all([
				this.storageService.getStats(),
				this.cacheService.getStats(),
			]);

			let totalItems = 0;
			let totalSize = 0;
			if (storageResult.success && storageResult.data) {
				totalItems += storageResult.data.totalItems;
				totalSize += storageResult.data.totalSize;
			}
			if (cacheResult.success && cacheResult.data) {
				totalItems += cacheResult.data.totalItems;
				totalSize += cacheResult.data.totalSize;
			}
			metrics.storage = { totalItems, totalSize };

			logger.apiRead('storage_metrics', {
				totalOps: metrics.totalOps,
				totalErrors: metrics.totalErrors,
				avgResponseTime: metrics.performance.avgResponseTime,
				totalItems: metrics.storage.totalItems,
				totalSize: metrics.storage.totalSize,
			});

			return metrics;
		} catch (error) {
			logger.storageError('Error getting storage metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createStorageError('get storage metrics', error);
		}
	}

	@Post('metrics/reset')
	@Roles(UserRole.ADMIN)
	async resetMetrics() {
		try {
			this.metricsService.resetMetrics();

			logger.apiUpdate('storage_metrics_reset', {});

			return { reset: true };
		} catch (error) {
			logger.storageError('Error resetting storage metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createStorageError('reset storage metrics', error);
		}
	}

	@Get('keys')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async getKeys() {
		try {
			const result = await this.storageService.getKeys();
			if (!result.success) {
				throw createStorageError('get keys', result.error);
			}

			logger.apiRead('storage_keys', {
				keysCount: result.data?.length ?? 0,
			});

			return result.data;
		} catch (error) {
			logger.storageError('Error getting storage keys', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createStorageError('get storage keys', error);
		}
	}

	@Get('item/:key')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_SECONDS)
	async getItem(@Param('key') key: string) {
		try {
			if (!key) {
				throw new HttpException(ErrorCode.KEY_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.storageService.get(key);
			if (!result.success) {
				throw createStorageError('get item', result.error);
			}

			logger.apiRead('storage_item_get', {
				key,
			});

			return result.data;
		} catch (error) {
			logger.storageError('Error getting storage item', {
				errorInfo: { message: getErrorMessage(error) },
				key,
			});
			throw createStorageError('get storage item', error);
		}
	}

	@Delete('clear')
	@Roles(UserRole.ADMIN)
	async clear() {
		try {
			const result = await this.storageService.clear();
			if (!result.success) {
				throw createStorageError('clear storage', result.error);
			}

			logger.apiDelete('storage_clear', {});

			return { cleared: true };
		} catch (error) {
			logger.storageError('Error clearing storage', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createStorageError('clear storage', error);
		}
	}
}
