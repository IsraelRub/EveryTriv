/**
 * Storage Controller
 *
 * @module storage.controller
 * @description Controller for storage service management and monitoring
 */
import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

import { CACHE_DURATION, ERROR_CODES, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger, metricsService } from '@internal/services';
import { createStorageError } from '@internal/utils';

import { Cache, Public, Roles } from '../../../common';
import { ServerStorageService } from './storage.service';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: ServerStorageService) {}

	/**
	 * Get storage service metrics
	 * @returns Storage metrics
	 */
	@Get('metrics')
	@Public()
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes - metrics don't change frequently
	async getMetrics() {
		try {
			const metrics = metricsService.getMetrics();

			logger.apiRead('storage_metrics', {
				totalOps: metrics.totalOps,
				totalErrors: metrics.totalErrors,
				avgResponseTime: metrics.performance.avgResponseTime,
			});

			return metrics;
		} catch (error) {
			logger.storageError('Error getting storage metrics', {
				error: getErrorMessage(error),
			});
			throw createStorageError('get storage metrics', error);
		}
	}

	/**
	 * Reset storage service metrics
	 * @returns Reset result
	 */
	@Post('metrics/reset')
	@Roles(UserRole.ADMIN)
	async resetMetrics() {
		try {
			metricsService.resetMetrics();

			logger.apiUpdate('storage_metrics_reset', {});

			return { reset: true };
		} catch (error) {
			logger.storageError('Error resetting storage metrics', {
				error: getErrorMessage(error),
			});
			throw createStorageError('reset storage metrics', error);
		}
	}

	/**
	 * Get storage keys
	 * @returns Storage keys
	 */
	@Get('keys')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
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
				error: getErrorMessage(error),
			});
			throw createStorageError('get storage keys', error);
		}
	}

	/**
	 * Get storage item
	 * @param key Storage key
	 * @returns Storage item
	 */
	@Get('item/:key')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.VERY_SHORT) // Cache for 30 seconds
	async getItem(@Param('key') key: string) {
		try {
			if (!key) {
				throw new HttpException(ERROR_CODES.KEY_REQUIRED, HttpStatus.BAD_REQUEST);
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
				error: getErrorMessage(error),
				key,
			});
			throw createStorageError('get storage item', error);
		}
	}

	/**
	 * Clear storage
	 * @returns Clear result
	 */
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
				error: getErrorMessage(error),
			});
			throw createStorageError('clear storage', error);
		}
	}
}
