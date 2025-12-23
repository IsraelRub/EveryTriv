/**
 * User analytics type definitions
 *
 * @module AnalyticsUserTypes
 * @description Structures describing user analytics queries, summaries, comparisons, and insights
 */
import { ComparisonTarget } from '../../../constants';
import type { ActivityEntry, DifficultyBreakdown, TopicsPlayed } from '../../core/data.types';
import type { UserRankData } from '../game/game.types';

/**
 * User analytics query interface
 */
export interface UserAnalyticsQuery {
	startDate?: Date;
	endDate?: Date;
	includeGameHistory?: boolean;
	includePerformance?: boolean;
	includeTopicBreakdown?: boolean;
}

/**
 * Unified user analytics record
 */
export interface UserAnalyticsRecord {
	totalGames: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageScore: number;
	bestScore: number;
	totalPlayTime: number;
	correctAnswers: number;
	userId?: string;
	favoriteTopic?: string;
	mostPlayedTopic?: string;
	averageTimePerQuestion?: number;
	totalScore?: number;
	topicsPlayed?: TopicsPlayed;
	difficultyBreakdown?: DifficultyBreakdown;
	recentActivity?: ActivityEntry[];
}

/**
 * User basic information interface
 */
export interface UserBasicInfo {
	userId: string;
	email: string;
	credits: number;
	purchasedCredits: number;
	totalCredits: number;
	createdAt: Date;
	accountAge: number;
}

/**
 * User performance metrics interface
 */
export interface UserPerformanceMetrics {
	lastPlayed: Date;
	streakDays: number;
	bestStreak: number;
	improvementRate: number;
	weakestTopic: string;
	strongestTopic: string;
	averageGameTime?: number;
	consistencyScore?: number;
	learningCurve?: number;
}

/**
 * Complete user analytics interface
 */
export interface CompleteUserAnalytics {
	basic: UserBasicInfo;
	game: UserAnalyticsRecord;
	performance: UserPerformanceMetrics;
	ranking: UserRankData;
	trends?: UserTrendPoint[];
}

/**
 * User progress topic analytics
 */
export interface UserProgressTopic {
	topic: string;
	gamesPlayed: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	successRate: number;
	averageResponseTime: number;
	lastPlayed: string | null;
	difficultyBreakdown: TopicsPlayed;
}

/**
 * User trend timeline point
 */
export interface UserTrendPoint {
	date: string;
	score: number;
	successRate: number;
	totalQuestionsAnswered: number;
	correctAnswers: number;
	topic?: string;
	difficulty?: string;
}

/**
 * User progress analytics
 */
export interface UserProgressAnalytics {
	topics: UserProgressTopic[];
	timeline: UserTrendPoint[];
	totals: {
		gamesPlayed: number;
		questionsAnswered: number;
		correctAnswers: number;
	};
}

/**
 * User insights data
 */
export interface UserInsightsData {
	strengths: string[];
	improvements: string[];
	recentHighlights: string[];
}

/**
 * User comparison metrics
 */
export interface UserComparisonMetrics {
	successRate: number;
	averageScore: number;
	totalGames: number;
	rank?: number;
	percentile?: number;
	streakDays?: number;
	bestStreak?: number;
	improvementRate?: number;
	consistencyScore?: number;
}

/**
 * User comparison result
 */
export interface UserComparisonResult {
	userId: string;
	target: ComparisonTarget;
	targetUserId?: string;
	userMetrics: UserComparisonMetrics;
	targetMetrics: UserComparisonMetrics;
	differences: UserComparisonMetrics;
}

/**
 * User summary data
 */
export interface UserSummaryData {
	user: UserBasicInfo;
	highlights: {
		totalGames: number;
		bestScore: number;
		topTopics: string[];
		achievementsUnlocked: number;
	};
	performance: UserPerformanceMetrics;
	insights: string[];
}
