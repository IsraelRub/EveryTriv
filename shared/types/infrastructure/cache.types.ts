/**
 * Cache-related types for EveryTriv
 * Shared between client and server
 *
 * @module CacheTypes
 * @description Cache interfaces and data structures
 */
import type { StorageValue } from '../core/data.types';
import type { QuestionCacheEntry } from '../domain/analytics/analytics.types';

/**
 * Cache statistics interface
 * @interface CacheStats
 * @description Comprehensive cache performance and usage statistics
 * @used_by server/src/features/cache/cache.controller.ts (getCacheStats), server/src/features/cache/cache.service.ts (getCacheStats)
 */
export interface CacheStats {
	/** Total number of cached topics */
	totalCachedTopics: number;
	/** Total number of cached questions */
	totalCachedQuestions: number;
	/** Cache hit rate percentage */
	cacheHitRate: number;
	/** Cache miss rate percentage */
	cacheMissRate: number;
	/** Total cache size in bytes */
	totalCacheSize: number;
}

/**
 * Cache questions query parameters interface
 * @interface CacheQuestionsQueryDto
 * @description Query parameters for retrieving cached questions
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions)
 */
export interface CacheQuestionsQueryDto {
	/** Topic name */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Language code (default: 'he') */
	language?: string;
}

/**
 * Cached question data interface
 * @interface CachedQuestionDto
 * @description Structure of cached question data
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions response)
 */
export interface CachedQuestionDto {
	/** Question text */
	question: string;
	/** Answer options */
	options: string[];
	/** Correct answer */
	correctAnswer: string;
	/** Optional explanation */
	explanation?: string;
}

/**
 * Cache questions response interface
 * @interface CacheQuestionsResponseDto
 * @description Response structure for cached questions request
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions)
 */
export interface CacheQuestionsResponseDto {
	/** Array of cached questions */
	questions: CachedQuestionDto[];
	/** Topic name */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Language code */
	language: string;
}

/**
 * Cache invalidation parameters interface
 * @interface CacheInvalidationDto
 * @description Parameters for cache invalidation operations
 * @used_by server/src/features/cache/cache.controller.ts (invalidateCache)
 */
export interface CacheInvalidationDto {
	/** Cache type to invalidate */
	type: string;
	/** Topic name to invalidate */
	topic?: string;
	/** Difficulty level to invalidate */
	difficulty?: string;
	/** Language code to invalidate (default: 'he') */
	language?: string;
}

/**
 * Cache statistics DTO interface
 * @interface CacheStatsDto
 * @description Data transfer object for cache statistics
 * @used_by server/src/features/cache/cache.controller.ts (getCacheStats response)
 */
export interface CacheStatsDto {
	/** Total number of cached topics */
	totalCachedTopics: number;
	/** Total number of cached questions */
	totalCachedQuestions: number;
	/** Cache hit rate percentage */
	cacheHitRate: number;
	/** Cache miss rate percentage */
	cacheMissRate: number;
	/** Total cache size in bytes */
	totalCacheSize: number;
}

/**
 * Cache health status interface
 * @interface CacheHealthStatus
 * @description Cache health check response structure
 * @used_by server/src/features/cache/cache.controller.ts (getCacheHealth)
 */
export interface CacheHealthStatus {
	/** Health status */
	status: 'healthy' | 'unhealthy';
	/** Timestamp of health check */
	timestamp: string;
	/** Cache statistics */
	stats?: CacheStats;
	/** Server uptime in seconds */
	uptime?: number;
	/** Error details if unhealthy */
	error?: string;
}

/**
 * User progress data interface
 * @interface UserProgressData
 * @description User progress information for a specific topic
 * @used_by server/src/features/cache/cache.controller.ts (getUserProgress)
 */
export interface UserProgressData {
	/** User ID */
	userId: string;
	/** Topic name */
	topic: string;
	/** Questions answered correctly */
	correctAnswers: number;
	/** Total questions attempted */
	totalQuestions: number;
	/** Average response time in milliseconds */
	averageResponseTime: number;
	/** Last played timestamp */
	lastPlayed: string;
	/** Difficulty level */
	difficulty: string;
}

/**
 * Question cache map interface
 * @interface QuestionCacheMap
 * @description Map structure for caching trivia questions
 * @used_by server/src/features/game/logic/providers/core/base.provider.ts (BaseTriviaProvider)
 */
export interface QuestionCacheMap extends Record<string, QuestionCacheEntry> {}

/**
 * Generic cache storage interface
 * @interface CacheStorage
 * @description Generic cache storage structure
 * @used_by server/src/features/game/logic/providers/core/base.provider.ts (BaseTriviaProvider)
 */
export interface CacheStorage extends Record<string, StorageValue> {}

/**
 * Cache data interface
 * @interface CacheData
 * @description Structure for cache data with metadata
 */
export interface CacheData extends Record<string, StorageValue> {
	/** The actual cached value */
	value: StorageValue;
	/** Time to live in seconds */
	ttl?: number;
	/** When the data was cached */
	cachedAt?: number;
	/** When the data expires */
	expiresAt?: string;
}
