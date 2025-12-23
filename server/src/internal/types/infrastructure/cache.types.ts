/**
 * Server Cache Types
 * @module ServerCacheTypes
 * @description Server-side cache type definitions
 */
import type { StorageValue } from '@shared/types';

/**
 * Cache entry interface
 * @interface CacheEntry
 * @description Common structure for cache entries with optional TTL
 */
export interface CacheEntry {
	key: string;
	value: StorageValue;
	ttl?: number;
}
