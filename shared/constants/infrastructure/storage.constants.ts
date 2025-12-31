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

// Storage type enum
export enum StorageType {
	PERSISTENT = 'persistent',
	CACHE = 'cache',
}

/**
 * Cache duration constants (in seconds)
 * @constant
 * @description Standard cache durations for different types of data
 */
export const CACHE_DURATION = {
	VERY_SHORT: 30, // 30 seconds
	SHORT: 60, // 1 minute
	MEDIUM: 300, // 5 minutes
	LONG: 600, // 10 minutes
	EXTENDED: 900, // 15 minutes
	THIRTY_MINUTES: 1800, // 30 minutes
	VERY_LONG: 3600, // 1 hour
	EXTREME: 86400, // 1 day

	// Specific cache keys
	TRIVIA_QUESTIONS: 3600, // 1 hour
	USER_PROFILE: 1800, // 30 minutes
	GAME_HISTORY: 7200, // 2 hours
	LEADERBOARD: 300, // 5 minutes
	USER_STATS: 3600, // 1 hour
	CREDITS_BALANCE: 300, // 5 minutes
	USER_ANALYTICS: 1800, // 30 minutes
	MULTIPLAYER_ROOM: 3600, // 1 hour
} as const;
