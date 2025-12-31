/**
 * Data types for EveryTriv
 * Shared between client and server
 *
 * @module DataTypes
 * @description Basic data structures and generic value types
 */

/**
 * Type guard function for runtime validation
 * @template T - The expected type
 * @type TypeGuard
 * @description Function that validates if a value is of type T
 * Used for runtime type checking in storage services, validation, and type guards
 * @used_by client/src/services/infrastructure/storage.service.ts, server/src/internal/modules/storage, shared/utils/domain
 */
export type TypeGuard<T> = (value: unknown) => value is T;

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
 * Base data value type
 * @type BaseDataValue
 * @description Allowed value types in BaseData
 */
export type BaseDataValue = BasicValue | string[] | Date;

/**
 * Base data interface
 * @interface BaseData
 * @description Base interface for flexible data structures without recursive nesting
 */
export type BaseData = Record<string, BaseDataValue>;

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
 * Common option interface for select components
 * @interface SelectOption
 * @description Standard option structure for dropdowns and selects
 */
export interface SelectOption {
	value: string;
	label: string;
}

/**
 * Activity entry interface
 * @interface ActivityEntry
 * @description Structure for user activity tracking
 */
export interface ActivityEntry {
	date: string;
	action: string;
	detail?: string;
	topic?: string;
	durationSeconds?: number;
}

/**
 * Generic count record type
 * @type CountRecord
 * @description Generic type alias for string-to-number mappings (counts, scores, distributions, etc.)
 * Used for topics, difficulties, players, and any other key-value count mappings
 */
export type CountRecord = Record<string, number>;

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

/**
 * Text position interface
 * @interface TextPosition
 * @description Position of text in a string (start and end indices)
 */
export interface TextPosition {
	start: number;
	end: number;
}
