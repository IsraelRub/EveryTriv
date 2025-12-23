/**
 * Server Core Cache Types
 * @module ServerCoreCacheTypes
 * @description Base cache type definitions for server-side cache entries
 */
import type { BaseCacheEntry as SharedBaseCacheEntry } from '@shared/types';

/**
 * Base cache entry interface with extended timestamp fields
 * @interface BaseCacheEntry
 * @description Extends shared BaseCacheEntry with lastAccessed tracking
 * Used for cache entries that track when items were created, updated, and last accessed
 * @used_by server/src/internal/types/domain/game.types.ts (QuestionCacheEntry)
 */
export interface BaseCacheEntry extends SharedBaseCacheEntry {
	lastAccessed: Date;
}
