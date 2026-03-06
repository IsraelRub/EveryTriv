// Common analytics types shared across analytics modules.
import { ComparisonTarget, TimePeriod, TrendPeriod } from '@shared/constants';

import type { CorePagination } from '../../core';

export interface UnifiedQuerySignatureInput {
	includeSections?: string[];
	startDate?: Date;
	endDate?: Date;
	groupBy?: TimePeriod;
	activityLimit?: number;
	trendLimit?: number;
	includeActivity?: boolean;
	targetUserId?: string;
	comparisonTarget?: ComparisonTarget;
}

export interface TimeStat {
	averageTime: number | null;
	medianTime: number | null;
}

export interface AnalyticsPaginationMetadata extends Partial<CorePagination> {
	page?: number;
	hasMore?: boolean;
}

export interface AnalyticsResponse<T = unknown> {
	data: T;
	metadata?: AnalyticsPaginationMetadata;
	timestamp: string;
}

export interface HistoryFilterOptions {
	startDate?: Date;
	endDate?: Date;
}

export interface ComparisonQueryOptions extends HistoryFilterOptions {
	target?: ComparisonTarget;
	targetUserId?: string;
}

export interface TrendQueryOptions extends HistoryFilterOptions {
	period?: TrendPeriod;
	limit?: number;
	groupBy?: TimePeriod;
}

export interface TopicAnalyticsQuery {
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}

export interface UserTrendQuery {
	startDate?: Date;
	endDate?: Date;
	groupBy?: TimePeriod;
	limit?: number;
}
