import { CacheInvalidationDto as ICacheInvalidationDto } from '@shared';
import { IsOptional, IsString } from 'class-validator';

/**
 * Cache invalidation DTO with validation
 * Extends the shared interface with validation decorators
 */
export class CacheInvalidationDto implements ICacheInvalidationDto {
	@IsString()
	type: string;

	@IsString()
	@IsOptional()
	topic?: string;

	@IsString()
	@IsOptional()
	difficulty?: string;

	@IsString()
	@IsOptional()
	language?: string;
}
