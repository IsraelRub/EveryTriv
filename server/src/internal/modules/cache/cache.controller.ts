import { Controller, Delete, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CACHE_DURATION, ERROR_CODES, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';
import { StorageOperation } from '@internal/constants';
import { serverLogger as logger } from '@internal/services';
import { createCacheError } from '@internal/utils';
import { Cache, Roles } from '../../../common';
import { CacheService } from './cache.service';

/**
 * Controller for cache management and monitoring
 * Provides endpoints for cache statistics, invalidation, and management
 */
@ApiTags('Cache Management')
@Controller('cache')
export class CacheController {
	constructor(private readonly cacheService: CacheService) {}

	/**
	 * Get cache statistics
	 */
	@Get('stats')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
	@ApiOperation({ summary: 'Get cache statistics' })
	@ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully' })
	async getStats() {
		try {
			const result = await this.cacheService.getStats();

			if (result.success && result.data) {
				logger.apiRead('cache_stats', {
					totalItems: result.data.totalItems,
					hitRate: result.data.hitRate,
					avgResponseTime: result.data.avgResponseTime,
				});
			}

			return result;
		} catch (error) {
			logger.cacheError(StorageOperation.GET, 'cache_stats', {
				error: getErrorMessage(error),
			});
			throw createCacheError('get cache stats', error);
		}
	}

	/**
	 * Clear all cache
	 */
	@Delete('clear')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Clear all cache entries' })
	@ApiResponse({ status: 200, description: 'Cache cleared successfully' })
	async clearCache() {
		try {
			await this.cacheService.clear();

			logger.apiDelete('cache_clear_all', {});

			return { cleared: true };
		} catch (error) {
			logger.cacheError(StorageOperation.CLEAR, 'cache_all', {
				error: getErrorMessage(error),
			});
			throw createCacheError('clear cache', error);
		}
	}

	/**
	 * Check if a key exists in cache
	 */
	@Get('exists/:key')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT)
	@ApiOperation({ summary: 'Check if a key exists in cache' })
	@ApiResponse({ status: 200, description: 'Key existence checked successfully' })
	async checkKeyExists(@Param('key') key: string) {
		try {
			if (!key) {
				throw new HttpException(ERROR_CODES.KEY_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const existsResult = await this.cacheService.exists(key);
			const exists = existsResult.success && existsResult.data === true;
			const ttl = exists ? await this.cacheService.getTTL(key) : -2;

			logger.apiRead('cache_key_exists', {
				key,
				exists,
				ttl,
			});

			return {
				key,
				exists,
				ttl,
			};
		} catch (error) {
			logger.cacheError(StorageOperation.EXISTS, `cache_key_${key}`, {
				error: getErrorMessage(error),
			});
			throw createCacheError('check key existence', error);
		}
	}

	/**
	 * Get TTL for a key
	 */
	@Get('ttl/:key')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.SHORT)
	@ApiOperation({ summary: 'Get TTL for a cache key' })
	@ApiResponse({ status: 200, description: 'TTL retrieved successfully' })
	async getKeyTTL(@Param('key') key: string) {
		try {
			if (!key) {
				throw new HttpException(ERROR_CODES.KEY_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const ttl = await this.cacheService.getTTL(key);
			const exists = ttl !== -2;

			logger.apiRead('cache_key_ttl', {
				key,
				ttl,
				exists,
			});

			return {
				key,
				ttl,
				exists,
			};
		} catch (error) {
			logger.cacheError(StorageOperation.GET_TTL, `cache_key_${key}`, {
				error: getErrorMessage(error),
			});
			throw createCacheError('get key TTL', error);
		}
	}
}
