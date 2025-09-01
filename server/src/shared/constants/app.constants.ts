/**
 * Server-specific application constants for EveryTriv
 * Server-only constants and configuration
 */

// Re-export shared constants
export {
	APP_DESCRIPTION,
	APP_NAME,
	CONTACT_INFO,
	COUNTRIES,
	POPULAR_TOPICS,
} from '../../../../shared/constants/info.constants';

// Environment types enum
export enum Environment {
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	TEST = 'test',
}

// Log levels enum
export enum ServerLogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
}

// Token types enum
export enum TokenType {
	BEARER = 'Bearer',
}

// Auth headers enum
export enum AuthHeader {
	AUTHORIZATION = 'Authorization',
}

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

// Auth constants
export const AUTH_CONSTANTS = {
	JWT_EXPIRATION: '24h',
	REFRESH_TOKEN_EXPIRATION: '7d',
	TOKEN_TYPE: TokenType.BEARER,
	AUTH_HEADER: AuthHeader.AUTHORIZATION,
	JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
} as const;

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
		SESSION: 86400, // 24 hours
		CACHE_SHORT: 300, // 5 minutes
		CACHE_MEDIUM: 3600, // 1 hour
		CACHE_LONG: 86400, // 24 hours
	},
};
