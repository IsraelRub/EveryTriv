/**
 * Analytics types for server-side analytics service
 *
 * @module ServerAnalyticsTypes
 * @description Type definitions for analytics service query options and internal accumulators
 * @used_by server/src/features/analytics/analytics.service.ts
 */
import type { HistoryFilterOptions, TopicsPlayed } from '@shared/types';

/**
 * Activity query options for user activity
 * @interface ActivityQueryOptions
 * @description Options for querying user activity with date range and limit
 * @extends HistoryFilterOptions
 */
export interface ActivityQueryOptions extends HistoryFilterOptions {
	limit?: number;
}

/**
 * Topic analytics accumulator for internal calculations
 * @interface TopicAnalyticsAccumulator
 * @description Internal accumulator type for building topic analytics data
 */
export interface TopicAnalyticsAccumulator {
	gamesPlayed: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	totalTimeSpent: number;
	lastPlayed: string | null;
	difficultyBreakdown: TopicsPlayed;
}
