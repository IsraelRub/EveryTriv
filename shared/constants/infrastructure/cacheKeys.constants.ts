export const CACHE_KEYS = {
	ANALYTICS: {
		USER: (userId: string) => `analytics:user:analytics:${userId}`,
		GLOBAL_STATS: 'analytics:global:stats',
		GLOBAL_DIFFICULTY: 'analytics:difficulty:global',
		BUSINESS_METRICS: 'analytics:business:metrics',
		TOPICS_STATS: (query?: unknown) => `analytics:topics:stats:${JSON.stringify(query ?? {})}`,
		TOPICS_STATS_PATTERN: 'analytics:topics:stats:*',
		ALL_PATTERN: 'analytics:*',
		GLOBAL_TRENDS: (query?: unknown) => `analytics:global:trends:${JSON.stringify(query ?? {})}`,
		GLOBAL_TRENDS_PATTERN: 'analytics:global:trends:*',
		USER_UNIFIED: (userId: string, querySig: string) => `analytics:user:unified:${userId}:${querySig}`,
		USER_UNIFIED_PATTERN: (userId: string) => `analytics:user:unified:${userId}:*`,
		EVENT: (userId: string, eventId: string) => `analytics:event:${userId}:${eventId}`,
		USER_EVENTS: (userId: string) => `analytics:events:${userId}`,
	},
	LEADERBOARD: {
		GLOBAL: (limit: number, offset: number) => `leaderboard:global:${limit}:${offset}`,
		PERIOD: (period: string, limit: number) => `leaderboard:${period}:${limit}`,
		STATS: (period: string) => `leaderboard:stats:${period}`,
		GLOBAL_PATTERN: 'leaderboard:global',
		ALL_PATTERN: 'leaderboard:*',
	},
	GAME_HISTORY: {
		USER: (userId: string) => `game_history:${userId}`,
		USER_WITH_PREFIX: (userId: string) => `cache:game_history:${userId}`,
		SEEN_QUESTIONS: (userId: string) => `game_history:seen_questions:${userId}`,
		ALL_PATTERN: 'game_history:*',
	},
	TRIVIA: {
		ALL_PATTERN: 'trivia:*',
	},
	USER_STATS: {
		ALL_PATTERN: 'user_stats:*',
	},
	PAYPAL: {
		ACCESS_TOKEN: 'paypal:access_token',
		ORDER: (orderId: string) => `paypal:order:${orderId}`,
		WEBHOOK_EVENT: (eventId: string) => `webhook:paypal:${eventId}`,
	},
	CREDITS: {
		BALANCE: (userId: string) => `credits:balance:${userId}`,
		PACKAGES_ALL: 'credits:packages:all',
	},
	USER: {
		PROFILE: (userId: string) => `user:profile:${userId}`,
		STATS: (userId: string) => `user:stats:${userId}`,
		CREDITS: (userId: string) => `user:credits:${userId}`,
		SEARCH: (query: string, limit: number) => `user:search:${query}:${limit}`,
	},
	PAYMENT: {
		HISTORY: (userId: string) => `payment:history:${userId}`,
		HISTORY_PATTERN: 'payment:history:*',
	},
	GAME: {
		SESSION: (userId: string, gameId: string) => `active_game_session:${userId}:${gameId}`,
		SESSION_PATTERN: 'active_game_session:*',
	},
	AUTH: {
		USER_LOGOUT_PATTERN_1: (userId: string) => `*:${userId}`,
		USER_LOGOUT_PATTERN_2: (userId: string) => `*:${userId}:*`,
		EMAIL_VERIFY: (token: string) => `email_verify:${token}`,
	},
	MULTIPLAYER: {
		ROOM: (roomId: string) => `multiplayer:room:${roomId}`,
		ROOM_PATTERN: 'multiplayer:room:*',
	},
	RATE_LIMIT: {
		WINDOW: (ip: string, path: string) => `ratelimit:${ip}:${path}`,
		BURST: (ip: string) => `ratelimit:burst:${ip}`,
	},
	ADMIN: {
		STATISTICS: 'admin:statistics',
	},
} as const;

export function toReactQueryKey(cacheKey: string): string[] {
	return cacheKey.split(':');
}
