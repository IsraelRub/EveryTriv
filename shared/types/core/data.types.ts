/**
 * Data types for EveryTriv
 * Shared between client and server
 *
 * @module DataTypes
 * @description Basic data structures and generic value types
 */

/**
 * Generic value type for metadata and configuration
 * @type BasicValue
 * @description Union type for all possible metadata and configuration values
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
export type StorageValue = BasicValue | Record<string, unknown> | BasicValue[] | unknown[] | Date | null | undefined;

/**
 * Base entity interface with common fields
 * @interface BaseEntity
 * @description Base interface for all entities with common fields
 */
export interface BaseEntity {
	id: string;
	createdAt: Date;
	updatedAt: Date;
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
 * Base data interface
 * @type BaseData
 * @description Base interface for flexible data structures
 */
export interface BaseData
	extends Record<string, number | boolean | string | string[] | BaseData | BaseData[] | Date | undefined> {}

