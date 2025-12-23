/**
 * Shared API constants for EveryTriv
 * Used by both client and server
 *
 * @module ApiConstants
 * @description API endpoints and configuration constants
 * @used_by server/src/features/game/game.controller.ts, client/src/services/api.service.ts, shared/services
 */

// Base API endpoints structure
export const API_ENDPOINTS_BASE = {
	AUTH: {
		BASE: '/auth',
		LOGIN: '/auth/login',
		REGISTER: '/auth/register',
		LOGOUT: '/auth/logout',
		REFRESH: '/auth/refresh',
		GOOGLE: '/auth/google',
		GOOGLE_CALLBACK: '/auth/google/callback',
		PROFILE: '/auth/profile',
		ADMIN_USERS: '/auth/admin/users',
	},
	USER: {
		BASE: '/user',
		PROFILE: '/user/profile',
		CREDITS: '/user/credits',
		STATS: '/user/stats',
		AVATAR: '/user/avatar',
		SEARCH: '/user/search',
		ACCOUNT: '/user/account',
		CHANGE_PASSWORD: '/user/change-password',
		PREFERENCES: '/user/preferences',
		PROFILE_FIELD: '/user/profile/:field',
		PREFERENCES_FIELD: '/user/preferences/:preference',
		GET_BY_ID: '/users/:id',
		UPDATE_CREDITS: '/users/credits/:userId',
		UPDATE_STATUS: '/users/:userId/status',
		UPDATE_FIELD: (field: string) => `/users/profile/${field}`,
		UPDATE_PREFERENCE: (preference: string) => `/users/preferences/${preference}`,
		ADMIN: {
			ALL: '/user/admin/all',
			STATUS_BY_USER_ID: '/user/admin/:userId/status',
		},
	},
	TRIVIA: {
		GENERATE: '/trivia/generate',
		VALIDATE: '/trivia/validate',
		HISTORY: '/trivia/history',
	},
	GAME_HISTORY: {
		CREATE: '/game-history',
		GET_ALL: '/game-history',
		LEADERBOARD: '/game-history/leaderboard',
		DELETE: (id: string) => `/game-history/${id}`,
		CLEAR: '/game-history',
	},
	PAYMENT: {
		BASE: '/payment',
		HISTORY: '/payment/history',
		CREATE: '/payment/create',
	},
	CREDITS: {
		BASE: '/credits',
		GET: '/credits',
		BALANCE: '/credits/balance',
		HISTORY: '/credits/history',
		PURCHASE: '/credits/purchase',
		CONFIRM_PURCHASE: '/credits/confirm-purchase',
	},
	GAME: {
		BASE: '/game',
		TRIVIA_BY_ID: '/game/trivia/:id',
		ANSWER: '/game/answer',
		TRIVIA: '/game/trivia',
		HISTORY: '/game/history',
		HISTORY_BY_ID: '/game/history/:gameId',
		VALIDATE_CUSTOM: '/game/validate-custom',
		BY_ID: '/game/:id',
	},
	MULTIPLAYER: {
		BASE: '/multiplayer',
		ROOMS: '/multiplayer/rooms',
		ROOMS_JOIN: '/multiplayer/rooms/join',
		ROOMS_LEAVE: '/multiplayer/rooms/leave',
		ROOMS_START: '/multiplayer/rooms/start',
		ROOMS_ANSWER: '/multiplayer/rooms/answer',
		ROOMS_BY_ID: '/multiplayer/rooms/:roomId',
		ROOMS_STATE: '/multiplayer/rooms/:roomId/state',
	},
} as const;

// Complete API endpoints (base + client extensions)
export const API_ENDPOINTS = {
	...API_ENDPOINTS_BASE,
	AUTH: {
		...API_ENDPOINTS_BASE.AUTH,
		ME: '/auth/me',
	},
	USER: {
		...API_ENDPOINTS_BASE.USER,
		CREDITS_DEDUCT: '/user/credits/deduct',
		UPDATE_FIELD: (field: string) => `/users/profile/${field}`,
		UPDATE_PREFERENCE: (preference: string) => `/users/preferences/${preference}`,
		GET_BY_ID: '/users/:id',
		BY_ID: '/users/:id',
		BY_USER_ID: '/users/:userId',
		CREDITS_BY_USER_ID: '/users/credits/:userId',
		UPDATE_CREDITS: '/users/credits/:userId',
		UPDATE_STATUS: '/users/:userId/status',
	},
	TRIVIA: {
		...API_ENDPOINTS_BASE.TRIVIA,
		GENERATE: '/v1/trivia',
		HISTORY: '/v1/trivia/history',
		SCORE: '/v1/trivia/score',
		LEADERBOARD: '/v1/trivia/leaderboard',
		DIFFICULTY_STATS: '/v1/trivia/difficulty-stats',
	},
	GAME_HISTORY: {
		...API_ENDPOINTS_BASE.GAME_HISTORY,
		USER: '/game-history/user',
		USER_RANK: '/game-history/user/rank',
		USER_STATS: '/game-history/user/stats',
		BY_ID: (id: string) => `/game-history/${id}`,
		DELETE: (id: string) => `/game-history/${id}`,
		CLEAR: '/game-history',
	},
	CREDITS: {
		...API_ENDPOINTS_BASE.CREDITS,
		PACKAGES: '/credits/packages',
		CAN_PLAY: '/credits/can-play',
		DEDUCT: '/credits/deduct',
	},
	PAYMENT: {
		...API_ENDPOINTS_BASE.PAYMENT,
		RETRY: (id: string) => `/payment/retry/${id}`,
		CONFIRM: '/payment/confirm',
		PURCHASE_CREDITS: '/payment/purchase-credits',
		CONFIRM_CREDIT_PURCHASE: '/payment/confirm-credit-purchase',
	},
	CLIENT_LOGS: {
		BASE: '/client-logs',
		BATCH: '/client-logs/batch',
	},
	ANALYTICS: {
		BASE: '/analytics',
		USER: '/analytics/user',
		USER_STATS: '/analytics/user-stats/:userId',
		USER_PERFORMANCE: '/analytics/user-performance/:userId',
		USER_PROGRESS: '/analytics/user-progress/:userId',
		USER_ACTIVITY: '/analytics/user-activity/:userId',
		USER_INSIGHTS: '/analytics/user-insights/:userId',
		USER_RECOMMENDATIONS: '/analytics/user-recommendations/:userId',
		USER_ACHIEVEMENTS: '/analytics/user-achievements/:userId',
		USER_TRENDS: '/analytics/user-trends/:userId',
		USER_COMPARISON: '/analytics/user-comparison/:userId',
		USER_SUMMARY: '/analytics/user-summary/:userId',
		TOPICS_POPULAR: '/analytics/topics/popular',
		DIFFICULTY_STATS: '/analytics/difficulty/stats',
		DIFFICULTY_GLOBAL: '/analytics/difficulty/global',
		TRACK: '/analytics/track',
		GLOBAL_STATS: '/analytics/global-stats',
		GLOBAL_TRENDS: '/analytics/global-trends',
		ADMIN_STATS_CLEAR_ALL: '/analytics/admin/stats/clear-all',
	},
	LEADERBOARD: {
		BASE: '/leaderboard',
		STATS: '/leaderboard/stats',
		USER_RANKING: '/leaderboard/user/ranking',
		USER_UPDATE: '/leaderboard/user/update',
		GLOBAL: '/leaderboard/global',
		PERIOD: '/leaderboard/period/:period',
		ADMIN_CLEAR_ALL: '/leaderboard/admin/clear-all',
	},
	GAME: {
		...API_ENDPOINTS_BASE.GAME,
		ADMIN: {
			STATISTICS: '/game/admin/statistics',
			HISTORY_CLEAR_ALL: '/game/admin/history/clear-all',
			TRIVIA: '/game/admin/trivia',
			TRIVIA_CLEAR_ALL: '/game/admin/trivia/clear-all',
		},
	},
	MULTIPLAYER: {
		...API_ENDPOINTS_BASE.MULTIPLAYER,
	},
	AI_PROVIDERS: {
		BASE: '/ai-providers',
		STATS: '/ai-providers/stats',
		HEALTH: '/ai-providers/health',
	},
} as const;

// Cookie names
export const COOKIE_NAMES = {
	AUTH_TOKEN: 'auth_token',
	REFRESH_TOKEN: 'refresh_token',
	USER_PREFERENCES: 'user_preferences',
} as const;

// API version
export const API_VERSION = 'v1';

// Pagination defaults
export const PAGINATION_DEFAULTS = {
	DEFAULT_PAGE: 1,
	DEFAULT_LIMIT: 10,
	MAX_LIMIT: 100,
} as const;

// Rate limiting defaults
export const RATE_LIMIT_DEFAULTS = {
	WINDOW_MS: 60000,
	MAX_REQUESTS: 200,
	MAX_REQUESTS_PER_WINDOW: 200,
	BURST_LIMIT: 50,
	BURST_WINDOW_MS: 10000,
	CLIENT_LOGS_MAX_REQUESTS: 50,
	CLIENT_LOGS_BURST_LIMIT: 10,
	MESSAGE: 'Too many requests, please try again later',
	BURST_MESSAGE: 'Rate limit exceeded, please slow down',
} as const;

// Alias for API_ROUTES (backward compatibility)
export const API_ROUTES = API_ENDPOINTS;
