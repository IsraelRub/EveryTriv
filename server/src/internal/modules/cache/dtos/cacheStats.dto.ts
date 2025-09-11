import { IsNumber } from 'class-validator';
import { CacheStats as ICacheStatsDto } from '@shared';

/**
 * Cache statistics DTO with validation
 * Extends the shared interface with validation decorators
 */
export class CacheStatsDto implements ICacheStatsDto {
	@IsNumber()
	totalCachedTopics: number;

	@IsNumber()
	totalCachedQuestions: number;

	@IsNumber()
	cacheHitRate: number;

	@IsNumber()
	cacheMissRate: number;

	@IsNumber()
	totalCacheSize: number;
}
