/**
 * Server Infrastructure Database Constants
 * @module ServerInfrastructureDatabaseConstants
 * @description Server-side database constants
 */

import { CACHE_DURATION } from '@shared/constants';

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

	KEY_PREFIXES: Object.fromEntries(Object.entries(RedisKeyPrefix).map(([key, value]) => [key, value])),

	TTL: {
		CACHE_SHORT: CACHE_DURATION.MEDIUM,
		CACHE_MEDIUM: CACHE_DURATION.VERY_LONG,
		CACHE_LONG: CACHE_DURATION.EXTREME,
		SESSION: CACHE_DURATION.EXTREME,
	},
};
