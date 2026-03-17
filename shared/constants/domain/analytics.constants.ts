export enum AnalyticsResult {
	SUCCESS = 'success',
	FAILURE = 'failure',
	ERROR = 'error',
}

export enum ComparisonTarget {
	GLOBAL = 'global',
	USER = 'user',
}

export enum AnalyticsEnvironment {
	DEVELOPMENT = 'development',
	STAGING = 'staging',
	PRODUCTION = 'production',
	TEST = 'test',
}

export enum TrendPeriod {
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
}

export enum AnalyticsEventType {
	PAGE_VIEW = 'page-view',
	PURCHASE_CREDITS = 'purchase-credits',
	GAME_START = 'game-start',
	GAME_COMPLETE = 'game-complete',
}

export enum AnalyticsPageName {
	PAYMENT = 'payment',
	GAME_SESSION = 'game-session',
	GAME_SUMMARY = 'game-summary',
}

export enum AnalyticsAction {
	VIEW = 'view',
	PURCHASE_SUCCESS = 'purchase-success',
	GAME_STARTED = 'game-started',
	GAME_FINALIZED = 'game-finalized',
}

export enum SystemInsightStatus {
	OPTIMAL = 'optimal',
	ATTENTION = 'attention',
}

export enum RecommendationPriority {
	HIGH = 'high',
	MEDIUM = 'medium',
	LOW = 'low',
}

export const SYSTEM_HEALTH_THRESHOLDS = {
	ERROR_RATE_ATTENTION_PERCENT: 5,
	MEMORY_USAGE_RECOMMENDATION_PERCENT: 80,
	MEMORY_USAGE_ATTENTION_PERCENT: 90,
	FAILED_LOGINS_ATTENTION_COUNT: 100,
} as const;
