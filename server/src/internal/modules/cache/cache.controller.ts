import { Controller, Delete, Get, HttpException, HttpStatus, Inject, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Redis } from 'ioredis';

import {
	ERROR_CODES,
	RATE_LIMIT_DEFAULTS,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	UserRole,
} from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { StorageOperation } from '@internal/constants';
import { serverLogger as logger } from '@internal/services';
import type { NestRequest } from '@internal/types';
import { createCacheError } from '@internal/utils';

import { Cache, Roles } from '../../../common';
import { CacheService } from './cache.service';

@ApiTags('Cache Management')
@Controller('cache')
export class CacheController {
	constructor(
		private readonly cacheService: CacheService,
		@Inject('REDIS_CLIENT') private readonly redis: Redis | null
	) {}

	@Get('stats')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	@ApiOperation({ summary: 'Get cache statistics' })
	@ApiResponse({
		status: 200,
		description: 'Cache statistics retrieved successfully',
	})
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
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createCacheError('get cache stats', error);
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createCacheError('clear cache', error);
		}
	}

	@Get('exists/:key')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	@ApiOperation({ summary: 'Check if a key exists in cache' })
	@ApiResponse({
		status: 200,
		description: 'Key existence checked successfully',
	})
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
				exists: exists ? 1 : 0,
				ttl,
			});

			return {
				key,
				exists: exists ? 1 : 0,
				ttl,
			};
		} catch (error) {
			logger.cacheError(StorageOperation.EXISTS, `cache_key_${key}`, {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createCacheError('check key existence', error);
		}
	}

	@Get('ttl/:key')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
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
				exists: exists ? 1 : 0,
			});

			return {
				key,
				ttl,
				exists: exists ? 1 : 0,
			};
		} catch (error) {
			logger.cacheError(StorageOperation.GET_TTL, `cache_key_${key}`, {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createCacheError('get key TTL', error);
		}
	}

	@Get('rate-limit-status')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Get current rate limit status for the requesting IP' })
	@ApiResponse({ status: 200, description: 'Rate limit status retrieved successfully' })
	async getRateLimitStatus(@Req() req: NestRequest) {
		try {
			if (!this.redis) {
				return {
					rateLimitingEnabled: false,
					reason: 'Redis not available',
					message: 'Rate limiting is disabled because Redis is not available',
				};
			}

			const ip = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
			const path = req.path;

			const burstKey = SERVER_CACHE_KEYS.RATE_LIMIT.BURST(ip);
			const windowKey = SERVER_CACHE_KEYS.RATE_LIMIT.WINDOW(ip, path);

			const [burstCount, burstTTL, windowCount, windowTTL] = await Promise.all([
				this.redis.get(burstKey).then(val => (val ? parseInt(val, 10) : 0)),
				this.redis.ttl(burstKey),
				this.redis.get(windowKey).then(val => (val ? parseInt(val, 10) : 0)),
				this.redis.ttl(windowKey),
			]);

			const burstLimit = RATE_LIMIT_DEFAULTS.BURST_LIMIT;
			const windowLimit = RATE_LIMIT_DEFAULTS.MAX_REQUESTS_PER_WINDOW;
			const burstWindowSeconds = TIME_DURATIONS_SECONDS.THIRTY_SECONDS;
			const windowSizeSeconds = RATE_LIMIT_DEFAULTS.WINDOW_MS / 1000;

			return {
				ip,
				path,
				rateLimitingEnabled: true,
				limits: {
					burst: {
						current: burstCount,
						limit: burstLimit,
						remaining: Math.max(0, burstLimit - burstCount),
						windowSeconds: burstWindowSeconds,
						ttl: burstTTL > 0 ? burstTTL : null,
						isExceeded: burstCount > burstLimit,
					},
					window: {
						current: windowCount,
						limit: windowLimit,
						remaining: Math.max(0, windowLimit - windowCount),
						windowSeconds: windowSizeSeconds,
						ttl: windowTTL > 0 ? windowTTL : null,
						isExceeded: windowCount > windowLimit,
					},
				},
				status: {
					blocked: burstCount > burstLimit || windowCount > windowLimit,
					reason:
						burstCount > burstLimit
							? 'Burst limit exceeded'
							: windowCount > windowLimit
								? 'Window limit exceeded'
								: 'OK',
				},
			};
		} catch (error) {
			logger.systemError('Failed to get rate limit status', {
				errorInfo: { message: getErrorMessage(error) },
				ip: req.ip,
			});
			throw createCacheError('get rate limit status', error);
		}
	}
}
