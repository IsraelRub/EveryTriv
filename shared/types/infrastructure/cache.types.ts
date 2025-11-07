/**
 * Cache-related types for EveryTriv
 * Shared between client and server
 *
 * @module CacheTypes
 * @description Cache interfaces and data structures
 */
import type { StorageValue } from '../core/data.types';

/**
 * Cache entry interface
 * @interface CacheEntry
 * @description Common structure for cache entries with optional TTL
 */
export interface CacheEntry<T = StorageValue> {
	key: string;
	value: T;
	ttl?: number;
}

/**
 * User progress data interface
 * @interface UserProgressData
 * @description User progress information for a specific topic
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
 * Cache data interface
 * @interface CacheData
 * @description Unified structure for cache entries across storage layers
 */
export interface CacheData {
	key?: string;
	value: StorageValue;
	ttl?: number;
	cachedAt?: Date;
	createdAt?: Date;
	expiresAt?: Date;
	metadata?: Record<string, StorageValue>;
}
