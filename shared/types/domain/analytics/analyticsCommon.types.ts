/**
 * Common analytics types shared across analytics modules
 *
 * @module AnalyticsCommonTypes
 * @description Base analytics helpers including result enums, pagination metadata, and time statistics
 */

/**
 * Analytics operation result type
 */
export type AnalyticsResult = 'success' | 'failure' | 'error';

/**
 * Supported analytics environments
 */
export type AnalyticsEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Time statistics raw result interface (raw from database)
 * Represents average and median times in seconds or milliseconds depending on context
 */
export interface TimeStat {
	averageTime: number | null;
	medianTime: number | null;
}

/**
 * Pagination metadata attached to analytics responses
 */
export interface AnalyticsPaginationMetadata {
	total?: number;
	page?: number;
	pageSize?: number;
	hasMore?: boolean;
}

/**
 * Generic analytics response structure
 */
export interface AnalyticsResponse<T = unknown> {
	data: T;
	metadata?: AnalyticsPaginationMetadata;
	timestamp: string;
}
