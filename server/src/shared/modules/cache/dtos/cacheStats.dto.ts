import { IsNumber, IsOptional } from 'class-validator';
import { CacheStatsDto as ICacheStatsDto } from 'everytriv-shared/types/cache.types';

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
	@IsOptional()
	cacheHitRate: number = 0;

	@IsNumber()
	@IsOptional()
	cacheMissRate: number = 0;

	@IsNumber()
	@IsOptional()
	totalCacheSize: number = 0;
}
