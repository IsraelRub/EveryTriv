/**
 * Cache Decorators
 *
 * @module CacheDecorators
 * @description Decorators for caching functionality
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

import type { CacheConfig } from '../../internal/types';

/**
 * Set cache configuration for endpoint
 * @param ttl Time to live in seconds
 * @param key Cache key (optional)
 * @returns Method decorator that sets cache configuration
 */
export const Cache = (ttl: number, key?: string) => SetMetadata('cache', { ttl, key });

/**
 * Set cache configuration with advanced options
 * @param config Cache configuration object
 * @returns Method decorator that sets advanced cache configuration
 */
export const CacheAdvanced = (config: CacheConfig) => SetMetadata('cache', config);

/**
 * Disable caching for endpoint
 * @returns Method decorator that disables caching
 */
export const NoCache = () => SetMetadata('cache', { ttl: 0, disabled: true });

/**
 * Set cache tags for invalidation
 * @param tags Array of cache tags
 * @returns Method decorator that sets cache tags
 */
export const CacheTags = (...tags: string[]) => SetMetadata('cacheTags', tags);

/**
 * Set cache with user-specific key
 * @param ttl Time to live in seconds
 * @param keyPrefix Cache key prefix
 * @returns Method decorator that sets user-specific cache
 */
export const CacheUser = (ttl: number, keyPrefix?: string) => SetMetadata('cacheUser', { ttl, keyPrefix });

/**
 * Set cache with conditional logic
 * @param condition Cache condition function
 * @param ttl Time to live in seconds
 * @returns Method decorator that sets conditional cache
 */
export const CacheConditional = (condition: (req: Record<string, unknown>) => boolean, ttl: number) =>
	SetMetadata('cacheConditional', { condition, ttl });

/**
 * Set cache with automatic invalidation
 * @param ttl Time to live in seconds
 * @param invalidateOn Array of events that invalidate cache
 * @returns Method decorator that sets auto-invalidating cache
 */
export const CacheAutoInvalidate = (ttl: number, invalidateOn: string[]) =>
	SetMetadata('cacheAutoInvalidate', { ttl, invalidateOn });

/**
 * Set cache with compression
 * @param ttl Time to live in seconds
 * @param compress Enable compression
 * @returns Method decorator that sets compressed cache
 */
export const CacheCompressed = (ttl: number, compress: boolean = true) =>
	SetMetadata('cacheCompressed', { ttl, compress });

/**
 * Set cache with priority
 * @param ttl Time to live in seconds
 * @param priority Cache priority (high, medium, low)
 * @returns Method decorator that sets prioritized cache
 */
export const CachePriority = (ttl: number, priority: 'high' | 'medium' | 'low') =>
	SetMetadata('cachePriority', { ttl, priority });
