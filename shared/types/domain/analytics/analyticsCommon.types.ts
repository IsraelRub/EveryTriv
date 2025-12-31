/**
 * Common analytics types shared across analytics modules
 *
 * @module AnalyticsCommonTypes
 * @description Base analytics helpers including result enums, pagination metadata, and time statistics
 */
import { ComparisonTarget, TrendPeriod } from '@shared/constants';
import type { CorePagination } from '../../core';

/**
 * Time statistics raw result interface (raw from database)
 * Represents average and median times in seconds or milliseconds depending on context
 */
export interface TimeStat {
	averageTime: number | null;
	medianTime: number | null;
}

/**
 * Analytics pagination metadata
 * @interface AnalyticsPaginationMetadata
 * @description Optional pagination metadata for analytics responses
 * @extends Partial<CorePagination>
 */
export interface AnalyticsPaginationMetadata extends Partial<CorePagination> {
	/** Current page number (1-based) */
	page?: number;
	/** Whether there are more items after current set */
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

/**
 * History filter options interface
 * @interface HistoryFilterOptions
 * @description Options for filtering history records by date range
 */
export interface HistoryFilterOptions {
	startDate?: Date;
	endDate?: Date;
}

/**
 * Comparison query options interface
 * @interface ComparisonQueryOptions
 * @description Options for comparing user performance
 */
export interface ComparisonQueryOptions extends HistoryFilterOptions {
	target?: ComparisonTarget;
	targetUserId?: string;
}

/**
 * Trend query options interface
 * @interface TrendQueryOptions
 * @description Options for querying trend data
 */
export interface TrendQueryOptions extends HistoryFilterOptions {
	period?: TrendPeriod;
	limit?: number;
	groupBy?: import('@shared/constants').TimePeriod;
}
