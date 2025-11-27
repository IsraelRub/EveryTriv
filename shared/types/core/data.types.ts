/**
 * Data types for EveryTriv
 * Shared between client and server
 *
 * @module DataTypes
 * @description Basic data structures and generic value types
 */
import { DifficultyLevel } from '../../constants';

/**
 * Generic value type for metadata and configuration
 * @type BasicValue
 * @description Union type for all possible metadata and configuration values
 * 

 */
export type BasicValue = string | number | boolean;

/**
 * Extended metadata value type for complex objects
 * @type StatsValue
 * @description Extended type for metadata that includes dates and objects
 */
export type StatsValue = BasicValue | Date | Record<string, BasicValue | Date>;

/**
 * Generic data value interface
 * @type StorageValue
 * @description Generic data value that can be stored in cache or transmitted
 */
export type StorageValue = BasicValue | Record<string, unknown> | BasicValue[] | unknown[] | Date | null | object;

/**
 * Request data type for API requests
 * @type RequestData
 * @description Data type for API request bodies that supports both StorageValue and interfaces without index signatures
 */
export type RequestData = StorageValue | unknown;

/**
 * Base timestamps interface with common timestamp fields
 * @interface BaseTimestamps
 * @description Base interface for objects with creation and update timestamps
 * Foundation for entities and stats objects that track creation and modification times
 */
export interface BaseTimestamps {
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Base entity interface with common fields
 * @interface BaseEntity
 * @description Base interface for all database entities with ID and timestamps
 * @used_by server/src/internal/entities (all TypeORM entities)
 */
export interface BaseEntity extends BaseTimestamps {
	id: string;
}

/**
 * Base cache entry interface with common timestamp fields
 * @interface BaseCacheEntry
 * @description Base interface for cache entries with creation, update, and access tracking
 * Used for cache entries that track when items were created, updated, and last accessed
 * @used_by server/src/internal/types/trivia.types.ts (QuestionCacheEntry)
 */
export interface BaseCacheEntry extends BaseTimestamps {
	lastAccessed: Date;
}

/**
 * Slow operation interface
 * @interface SlowOperation
 * @description Common structure for slow operations tracking
 */
export interface SlowOperation {
	operation: string;
	duration: number;
	timestamp: Date;
	metadata?: Record<string, BasicValue>;
}

/**
 * Base data value type
 * @type BaseDataValue
 * @description Allowed value types in BaseData
 */
export type BaseDataValue = number | boolean | string | string[] | Date;

/**
 * Base data interface
 * @interface BaseData
 * @description Base interface for flexible data structures without recursive nesting
 */
export interface BaseData extends Record<string, BaseDataValue> {}

/**
 * Common option interface for select components
 * @interface SelectOption
 * @description Standard option structure for dropdowns and selects
 */
export interface SelectOption {
	value: string;
	label: string;
}

/**
 * Favorite topic interface
 * @interface FavoriteTopic
 * @description Structure for favorite topics with difficulty
 */
export interface FavoriteTopic {
	topic: string;
	difficulty: DifficultyLevel;
}

/**
 * Activity entry interface
 * @interface ActivityEntry
 * @description Structure for user activity tracking
 */
export interface ActivityEntry {
	date: Date;
	action: string;
	detail?: string;
	topic?: string;
	durationSeconds?: number;
}

/**
 * Topics played interface
 * @interface TopicsPlayed
 * @description Type alias for topics played statistics
 */
export type TopicsPlayed = Record<string, number>;

/**
 * Difficulty statistics interface
 * @interface DifficultyStats
 * @description Common structure for difficulty statistics with total and correct counts
 */
export interface DifficultyStats {
	total: number;
	correct: number;
	successRate?: number;
}

/**
 * Difficulty breakdown interface
 * @interface DifficultyBreakdown
 * @description Type alias for difficulty breakdown statistics
 */
export type DifficultyBreakdown = Record<string, DifficultyStats>;
