/**
 * Storage constants for EveryTriv
 * Used by both client and server
 *
 * @module StorageConstants
 * @description Storage keys and configuration constants
 * @used_by client/src/constants, server/src/internal/modules/storage
 */

// Storage configuration
export const STORAGE_CONFIG = {
	PREFIX: 'everytriv_',
	DEFAULT_TTL: 3600, // 1 hour
	MAX_SIZE: 5 * 1024 * 1024, // 5MB
	ENABLE_COMPRESSION: false,
	ENABLE_METRICS: true,
} as const;

// Cache TTL values
export const CACHE_TTL = {
	// General TTL presets
	SHORT: 300, // 5 minutes
	MEDIUM: 1800, // 30 minutes
	LONG: 3600, // 1 hour
	VERY_LONG: 86400, // 24 hours

	// Specific cache keys
	TRIVIA_QUESTIONS: 3600, // 1 hour (from server)
	USER_PROFILE: 1800, // 30 minutes (from server)
	GAME_HISTORY: 7200, // 2 hours (from server)
	LEADERBOARD: 300, // 5 minutes
	USER_STATS: 3600, // 1 hour (from server)
	CREDITS_BALANCE: 300, // 5 minutes (from server)
	USER_ANALYTICS: 1800, // 30 minutes
} as const;

// Storage type enum (re-exported from types for convenience)
export enum StorageType {
	PERSISTENT = 'persistent',
	CACHE = 'cache',
	HYBRID = 'hybrid',
}

/**
 * Storage get strategy enumeration
 * @enum StorageGetStrategy
 * @description Strategy for reading from storage
 */
export enum StorageGetStrategy {
	CACHE_FIRST = 'cache-first',
	PERSISTENT_FIRST = 'persistent-first',
	BOTH = 'both',
}

// Default validators for storage values
export const defaultValidators = {
	string: (value: unknown): value is string => typeof value === 'string',
	number: (value: unknown): value is number => typeof value === 'number' && !Number.isNaN(value),
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
	date: (value: unknown): value is Date =>
		value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value))),
} as const;
