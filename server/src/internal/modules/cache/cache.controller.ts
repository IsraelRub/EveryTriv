import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CacheService } from './cache.service';
import { CacheStatsDto } from './dtos';

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
	@ApiOperation({ summary: 'Get cache statistics' })
	@ApiResponse({ status: 200, description: 'Cache statistics retrieved successfully', type: CacheStatsDto })
	async getStats() {
		return await this.cacheService.getStats();
	}

	/**
	 * Clear all cache
	 */
	@Delete('clear')
	@ApiOperation({ summary: 'Clear all cache entries' })
	@ApiResponse({ status: 200, description: 'Cache cleared successfully' })
	async clearCache() {
		await this.cacheService.clear();
		return { message: 'Cache cleared successfully' };
	}

	/**
	 * Check if a key exists in cache
	 */
	@Get('exists/:key')
	@ApiOperation({ summary: 'Check if a key exists in cache' })
	@ApiResponse({ status: 200, description: 'Key existence checked successfully' })
	async checkKeyExists(@Param('key') key: string) {
		const exists = await this.cacheService.exists(key);
		return {
			key,
			exists,
			ttl: exists ? await this.cacheService.getTTL(key) : -2,
		};
	}

	/**
	 * Get TTL for a key
	 */
	@Get('ttl/:key')
	@ApiOperation({ summary: 'Get TTL for a cache key' })
	@ApiResponse({ status: 200, description: 'TTL retrieved successfully' })
	async getKeyTTL(@Param('key') key: string) {
		const ttl = await this.cacheService.getTTL(key);
		return {
			key,
			ttl,
			exists: ttl !== -2,
		};
	}
}
