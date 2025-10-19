/**
 * Server-specific database constants for EveryTriv
 * Server-only database configuration
 */
import { CACHE_DURATION } from '@shared/constants';

// Database table names enum
export enum DatabaseTable {
	USERS = 'users',
	TRIVIA = 'trivia',
	USER_STATS = 'user_stats',
	ACHIEVEMENTS = 'achievements',
	USER_ACHIEVEMENTS = 'user_achievements',
	FAVORITES = 'favorites',
}

// Redis key prefixes enum
export enum RedisKeyPrefix {
	SESSION = 'session:',
	USER = 'user:',
	CACHE = 'cache:',
	RATE_LIMIT = 'rate-limit:',
	TRIVIA_QUEUE = 'trivia-queue:',
	TRIVIA_STATS = 'trivia-stats:',
}

// Redis constants
export const REDIS_CONSTANTS = {
	/**
	 * Default connection options - lazy loaded to ensure env vars are available
	 */
	get CONNECTION() {
		return {
			HOST: process.env.REDIS_HOST || 'localhost',
			PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
			PASSWORD: process.env.REDIS_PASSWORD || '',
			DB: parseInt(process.env.REDIS_DB || '0', 10),
			RECONNECT_ATTEMPTS: 10,
			RECONNECT_DELAY: 1000,
		};
	},

	/**
	 * Redis key prefixes for different types of data
	 */
	KEY_PREFIXES: Object.fromEntries(Object.entries(RedisKeyPrefix).map(([key, value]) => [key, value])),

	/**
	 * Default TTL values in seconds
	 */
	TTL: {
		CACHE_SHORT: CACHE_DURATION.MEDIUM, // 5 minutes
		CACHE_MEDIUM: CACHE_DURATION.VERY_LONG, // 1 hour
		CACHE_LONG: CACHE_DURATION.EXTREME, // 24 hours
		SESSION: CACHE_DURATION.EXTREME, // 24 hours
	},
};
