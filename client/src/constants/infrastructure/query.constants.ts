import { CACHE_KEYS, toReactQueryKey, type GameMode } from '@shared/constants';
import type { TopicAnalyticsQuery, UserTrendQuery } from '@shared/types';

export const QUERY_KEYS = {
	// Global keys
	all: ['everytriv'] as const,

	// Auth keys
	auth: {
		all: ['auth'] as const,
		currentUser: () => [...QUERY_KEYS.auth.all, 'current-user'] as const,
	},

	// User keys
	// Keys that sync with server cache use CACHE_KEYS + toReactQueryKey internally - conversion happens here only
	user: {
		all: ['user'] as const,
		profile: (userId: string = 'current') => toReactQueryKey(CACHE_KEYS.USER.PROFILE(userId)),
		credits: (userId: string = 'current') => toReactQueryKey(CACHE_KEYS.USER.CREDITS(userId)),
		userProfile: () => [...QUERY_KEYS.user.all, 'userProfile'] as const, // Specific for useUserProfile hook (client-only)
		userPreferences: () => [...QUERY_KEYS.user.all, 'userPreferences'] as const, // Specific for useUserPreferences hook (client-only)
	},

	// Credits keys
	// Keys that sync with server cache use CACHE_KEYS + toReactQueryKey internally - conversion happens here only
	credits: {
		all: ['credits'] as const,
		balance: (userId: string = 'current') => toReactQueryKey(CACHE_KEYS.CREDITS.BALANCE(userId)),
		packages: () => toReactQueryKey(CACHE_KEYS.CREDITS.PACKAGES_ALL),
		canPlay: (questionsPerRequest: number, gameMode: string | GameMode) =>
			[...QUERY_KEYS.credits.all, 'can-play', questionsPerRequest, gameMode] as const, // Client-only calculation
		paymentHistory: (userId: string = 'current') => toReactQueryKey(CACHE_KEYS.PAYMENT.HISTORY(userId)),
	},

	// Trivia keys
	trivia: {
		all: ['trivia'] as const,
		lists: () => [...QUERY_KEYS.trivia.all, 'list'] as const,
		list: (filters: string) => [...QUERY_KEYS.trivia.lists(), { filters }] as const,
		details: () => [...QUERY_KEYS.trivia.all, 'detail'] as const,
		detail: (id: number) => [...QUERY_KEYS.trivia.details(), id] as const,
		history: () => [...QUERY_KEYS.trivia.all, 'history'] as const,
		question: (request: unknown) => [...QUERY_KEYS.trivia.all, 'question', request] as const,
		score: (userId: string) => [...QUERY_KEYS.trivia.all, 'score', userId] as const,
		leaderboard: (limit: number) => [...QUERY_KEYS.trivia.all, 'leaderboard', limit] as const,
		gameHistory: (userId: string = 'current', limit?: number, offset?: number) => {
			const baseKey = toReactQueryKey(CACHE_KEYS.GAME_HISTORY.USER(userId));
			return [...baseKey, ...(limit != null ? [limit] : []), ...(offset != null ? [offset] : [])];
		},
	},

	// Leaderboard keys (for leaderboard lists only)
	// Uses CACHE_KEYS directly for server cache sync - conversion happens here only
	leaderboard: {
		all: ['leaderboard'] as const,
		global: (limit: number = 100, offset: number = 0) => toReactQueryKey(CACHE_KEYS.LEADERBOARD.GLOBAL(limit, offset)),
		byPeriod: (period: string, limit: number = 100) => toReactQueryKey(CACHE_KEYS.LEADERBOARD.PERIOD(period, limit)),
		stats: (period: string) => toReactQueryKey(CACHE_KEYS.LEADERBOARD.STATS(period)),
	},

	// Analytics keys
	// Keys that sync with server cache use CACHE_KEYS + toReactQueryKey internally - conversion happens here only
	analytics: {
		all: ['analytics'] as const,
		user: (userId: string = 'current') => toReactQueryKey(CACHE_KEYS.ANALYTICS.USER(userId)),
		popularTopics: (query?: TopicAnalyticsQuery) => toReactQueryKey(CACHE_KEYS.ANALYTICS.TOPICS_STATS(query)),
		globalDifficultyStats: () => toReactQueryKey(CACHE_KEYS.ANALYTICS.GLOBAL_DIFFICULTY),
		globalStats: () => toReactQueryKey(CACHE_KEYS.ANALYTICS.GLOBAL_STATS),
		globalTrends: (query?: unknown) => toReactQueryKey(CACHE_KEYS.ANALYTICS.GLOBAL_TRENDS(query)),
		businessMetrics: () => toReactQueryKey(CACHE_KEYS.ANALYTICS.BUSINESS_METRICS),
		systemPerformance: () => [...QUERY_KEYS.analytics.all, 'systemPerformance'] as const,
		systemSecurity: () => [...QUERY_KEYS.analytics.all, 'systemSecurity'] as const,
		systemRecommendations: () => [...QUERY_KEYS.analytics.all, 'systemRecommendations'] as const,
		systemInsights: () => [...QUERY_KEYS.analytics.all, 'systemInsights'] as const,
	},

	// Admin keys
	admin: {
		all: ['admin'] as const,
		gameStatistics: () => [...QUERY_KEYS.admin.all, 'adminGameStatistics'] as const,
		gameHistory: () => [...QUERY_KEYS.admin.all, 'gameHistory'] as const,
		games: () => [...QUERY_KEYS.admin.all, 'games'] as const,
		allTriviaQuestions: () => [...QUERY_KEYS.admin.all, 'adminAllTriviaQuestions'] as const,
		userStatistics: (userId?: string) =>
			[...QUERY_KEYS.admin.all, 'adminUserStatistics', ...(userId ? [userId] : [])] as const,
		userSummary: (userId?: string, includeActivity?: boolean) =>
			[
				...QUERY_KEYS.admin.all,
				'adminUserSummary',
				...(userId ? [userId] : []),
				...(includeActivity !== undefined ? [includeActivity] : []),
			] as const,
		userPerformance: (userId?: string) =>
			[...QUERY_KEYS.admin.all, 'adminUserPerformance', ...(userId ? [userId] : [])] as const,
		userProgress: (userId?: string, params?: UserTrendQuery) =>
			[...QUERY_KEYS.admin.all, 'adminUserProgress', ...(userId ? [userId] : []), ...(params ? [params] : [])] as const,
		userActivity: (userId?: string, params?: unknown) =>
			[...QUERY_KEYS.admin.all, 'adminUserActivity', ...(userId ? [userId] : []), ...(params ? [params] : [])] as const,
		userInsights: (userId?: string) =>
			[...QUERY_KEYS.admin.all, 'adminUserInsights', ...(userId ? [userId] : [])] as const,
		userRecommendations: (userId?: string) =>
			[...QUERY_KEYS.admin.all, 'adminUserRecommendations', ...(userId ? [userId] : [])] as const,
		userAchievements: (userId?: string) =>
			[...QUERY_KEYS.admin.all, 'adminUserAchievements', ...(userId ? [userId] : [])] as const,
		userTrends: (userId?: string, params?: unknown) =>
			[...QUERY_KEYS.admin.all, 'adminUserTrends', ...(userId ? [userId] : []), ...(params ? [params] : [])] as const,
		userComparison: (userId?: string, params?: unknown) =>
			[
				...QUERY_KEYS.admin.all,
				'adminUserComparison',
				...(userId ? [userId] : []),
				...(params ? [params] : []),
			] as const,
		analytics: () => [...QUERY_KEYS.admin.all, 'analytics'] as const,
		userAnalytics: () => [...QUERY_KEYS.admin.all, 'userAnalytics'] as const,
		businessMetrics: () => [...QUERY_KEYS.admin.all, 'businessMetrics'] as const,
		systemPerformance: () => [...QUERY_KEYS.admin.all, 'systemPerformance'] as const,
		systemSecurity: () => [...QUERY_KEYS.admin.all, 'systemSecurity'] as const,
		systemRecommendations: () => [...QUERY_KEYS.admin.all, 'systemRecommendations'] as const,
		systemInsights: () => [...QUERY_KEYS.admin.all, 'systemInsights'] as const,
		users: (limit: number, offset: number) => [...QUERY_KEYS.admin.all, 'adminUsers', limit, offset] as const,
		aiProviderStats: () => [...QUERY_KEYS.admin.all, 'aiProviderStats'] as const,
		aiProviderHealth: () => [...QUERY_KEYS.admin.all, 'aiProviderHealth'] as const,
	},
} as const;
