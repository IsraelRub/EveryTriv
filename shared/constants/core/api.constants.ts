/**
 * Shared API constants for EveryTriv
 * Used by both client and server
 *
 * @module ApiConstants
 * @description API endpoints and configuration constants
 * @used_by server: server/src/features/game/game.controller.ts (route definitions), client: client/src/services/api.service.ts (endpoint URLs), shared/services/http-client.ts (base URL configuration)
 */

// Base API endpoints structure
export const API_ENDPOINTS_BASE = {
	AUTH: {
		LOGIN: '/auth/login',
		REGISTER: '/auth/register',
		LOGOUT: '/auth/logout',
		REFRESH: '/auth/refresh',
		GOOGLE: '/auth/google',
		PROFILE: '/auth/profile',
	},
	USER: {
		PROFILE: '/user/profile',
		CREDITS: '/user/credits',
		STATS: '/user/stats',
		UPDATE_FIELD: (field: string) => `/users/profile/${field}`,
		UPDATE_PREFERENCE: (preference: string) => `/users/preferences/${preference}`,
		GET_BY_ID: (id: string) => `/users/${id}`,
		UPDATE_CREDITS: (userId: string) => `/users/credits/${userId}`,
		UPDATE_STATUS: (userId: string) => `/users/${userId}/status`,
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
	SUBSCRIPTION: {
		PLANS: '/subscription/plans',
		CURRENT: '/subscription/current',
		CREATE: '/subscription/create',
		CANCEL: '/subscription/cancel',
	},
	PAYMENT: {
		HISTORY: '/payment/history',
		CREATE: '/payment/create',
	},
	POINTS: {
		GET: '/points',
		BALANCE: '/points/balance',
		HISTORY: '/points/history',
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
		GET_BY_ID: (id: string) => `/users/${id}`,
		UPDATE_CREDITS: (userId: string) => `/users/credits/${userId}`,
		UPDATE_STATUS: (userId: string) => `/users/${userId}/status`,
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
	POINTS: {
		...API_ENDPOINTS_BASE.POINTS,
		PACKAGES: '/points/packages',
		CAN_PLAY: '/points/can-play',
		DEDUCT: '/points/deduct',
	},
	PAYMENT: {
		...API_ENDPOINTS_BASE.PAYMENT,
		CREATE_SUBSCRIPTION: '/payment/create-subscription',
		CANCEL_SUBSCRIPTION: '/payment/cancel-subscription',
		RETRY: (id: string) => `/payment/retry/${id}`,
		CONFIRM: '/payment/confirm',
		PURCHASE_POINTS: '/payment/purchase-points',
		CONFIRM_POINT_PURCHASE: '/payment/confirm-point-purchase',
	},
	CLIENT_LOGS: {
		BATCH: '/client-logs/batch',
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
	MAX_REQUESTS: 100,
	MAX_REQUESTS_PER_WINDOW: 100,
	BURST_LIMIT: 20,
	BURST_WINDOW_MS: 10000,
	CLIENT_LOGS_MAX_REQUESTS: 50,
	CLIENT_LOGS_BURST_LIMIT: 10,
	MESSAGE: 'Too many requests, please try again later',
	BURST_MESSAGE: 'Rate limit exceeded, please slow down',
} as const;
