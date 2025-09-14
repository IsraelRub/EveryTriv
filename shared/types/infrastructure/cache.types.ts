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
	totalCachedTopics: number;
	totalCachedQuestions: number;
	cacheHitRate: number;
	cacheMissRate: number;
	totalCacheSize: number;
}

/**
 * Cache questions query parameters interface
 * @interface CacheQuestionsQueryDto
 * @description Query parameters for retrieving cached questions
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions)
 */
export interface CacheQuestionsQueryDto {
	topic: string;
	difficulty: string;
	language?: string;
}

/**
 * Cached question data interface
 * @interface CachedQuestionDto
 * @description Structure of cached question data
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions response)
 */
export interface CachedQuestionDto {
	question: string;
	options: string[];
	correctAnswer: string;
	explanation?: string;
}

/**
 * Cache questions response interface
 * @interface CacheQuestionsResponseDto
 * @description Response structure for cached questions request
 * @used_by server/src/features/cache/cache.controller.ts (getCachedQuestions)
 */
export interface CacheQuestionsResponseDto {
	questions: CachedQuestionDto[];
	topic: string;
	difficulty: string;
	language: string;
}

/**
 * Cache invalidation parameters interface
 * @interface CacheInvalidationDto
 * @description Parameters for cache invalidation operations
 * @used_by server/src/features/cache/cache.controller.ts (invalidateCache)
 */
export interface CacheInvalidationDto {
	type: string;
	topic?: string;
	difficulty?: string;
	language?: string;
}

/**
 * Cache statistics DTO interface
 * @interface CacheStatsDto
 * @description Data transfer object for cache statistics
 * @used_by server/src/features/cache/cache.controller.ts (getCacheStats response)
 */
export interface CacheStatsDto {
	totalCachedTopics: number;
	totalCachedQuestions: number;
	cacheHitRate: number;
	cacheMissRate: number;
	totalCacheSize: number;
}

/**
 * Cache health status interface
 * @interface CacheHealthStatus
 * @description Cache health check response structure
 * @used_by server/src/features/cache/cache.controller.ts (getCacheHealth)
 */
export interface CacheHealthStatus {
	status: 'healthy' | 'unhealthy';
	timestamp: string;
	stats?: CacheStats;
	uptime?: number;
	error?: string;
}

/**
 * User progress data interface
 * @interface UserProgressData
 * @description User progress information for a specific topic
 * @used_by server/src/features/cache/cache.controller.ts (getUserProgress)
 */
export interface UserProgressData {
	userId: string;
	topic: string;
	correctAnswers: number;
	totalQuestions: number;
	averageResponseTime: number;
	lastPlayed: string;
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
	value: StorageValue;
	ttl?: number;
	cachedAt?: number;
	expiresAt?: string;
}
