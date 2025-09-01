/**
 * Storage constants for EveryTriv
 * Used by both client and server
 *
 * @module StorageConstants
 * @description Storage keys and configuration constants
 * @used_by client/src/constants/storage.constants.ts (client storage), server/src/shared/modules/storage (server storage)
 */

// Storage keys for client-side data
export const STORAGE_KEYS = {
	USER_ID: 'everytriv_user_id',
	THEME: 'everytriv_theme',
	AUDIO_SETTINGS: 'everytriv_audio_settings',
	GAME_PREFERENCES: 'everytriv_game_preferences',
	USER_PROGRESS: 'everytriv_user_progress',
	GAME_SESSION: 'everytriv_game_session',
	CACHE_DATA: 'everytriv_cache_data',
} as const;

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
