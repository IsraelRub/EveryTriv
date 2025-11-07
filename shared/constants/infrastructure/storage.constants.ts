/**
 * Storage constants for EveryTriv
 * Used by both client and server
 *
 * @module StorageConstants
 * @description Storage keys and configuration constants
 * @used_by client/src/constants, server/src/internal/modules/storage
 */

// Storage keys moved to client/src/constants/storage/storage.constants.ts

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
	POINTS_BALANCE: 300, // 5 minutes (from server)
	USER_ANALYTICS: 1800, // 30 minutes
} as const;
