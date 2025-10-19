/**
 * Cache Feature Index
 *
 * @module CacheFeature
 * @description Redis caching and data persistence feature module
 * @used_by server/app.module, server/features/game
 */

/**
 * Cache module and services
 * @description Redis caching and data management
 * @used_by server/app.module, server/services
 */
export { CacheModule } from './cache.module';
export { CacheService } from './cache.service';

/**
 * Cache DTOs
 * @description Data transfer objects for cache operations
 * @used_by server/features/cache, server/controllers
 */
export { CacheInvalidationDto } from './dtos/cacheInvalidation.dto';
export { CachedQuestionDto } from './dtos/cacheQuestions.dto';
export { CacheStatsDto } from './dtos/cacheStats.dto';

/**
 * Cache Types
 * @description Types for cache operations
 * @used_by server/features/cache
 */
export type CacheKey = string;
export type CacheValue = unknown;
export type CacheTTL = number;

/**
 * Cache Constants
 * @description Constants for cache operations
 * @used_by server/features/cache
 */
export { CACHE_TTL } from '@shared/constants';
