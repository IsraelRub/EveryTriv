/**
 * Analytics Constants for EveryTriv
 *
 * @module AnalyticsConstants
 * @description Analytics-related constants and enums
 * @used_by server/src/features/analytics, client/src/views/analytics
 */

/**
 * Analytics operation result enum
 * @enum AnalyticsResult
 * @description Result of analytics operations
 */
export enum AnalyticsResult {
	SUCCESS = 'success',
	FAILURE = 'failure',
	ERROR = 'error',
}

/**
 * Comparison target enum
 * @enum ComparisonTarget
 * @description Target for user performance comparison
 */
export enum ComparisonTarget {
	GLOBAL = 'global',
	USER = 'user',
}

/**
 * Analytics environment enumeration
 * @enum AnalyticsEnvironment
 * @description Supported analytics environments
 */
export enum AnalyticsEnvironment {
	DEVELOPMENT = 'development',
	STAGING = 'staging',
	PRODUCTION = 'production',
	TEST = 'test',
}

/**
 * Trend period enumeration
 * @enum TrendPeriod
 * @description Time periods for trend analysis
 */
export enum TrendPeriod {
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
}
