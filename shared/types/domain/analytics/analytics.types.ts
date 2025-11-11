/**
 * Analytics-related types for EveryTriv
 *
 * @module AnalyticsTypes
 * @description Type definitions for analytics and metrics data structures
 * @used_by server/src/features/analytics/analytics.service.ts
 */
import type { ActivityEntry, BasicValue, DifficultyStats } from '../../core/data.types';
import type { BaseGameStatistics, UserRankData } from '../game/game.types';

/**
 * Raw query result interfaces for TypeORM
 * @description Type definitions for raw query results from database
 */

/**
 * Topic statistics raw result interface (raw from database)
 * @interface TopicStatRaw
 * @description Raw result from topic statistics query
 */
export interface TopicStatRaw {
	topic: string;
	count: number;
	avgCorrect?: number | null;
	avgTime?: number | null;
}

/**
 * Difficulty statistics raw result interface (raw from database)
 * @interface DifficultyStatRaw
 * @description Raw result from difficulty statistics query
 */
export interface DifficultyStatRaw {
	difficulty: string;
	total: number;
	correct: number;
	averageTime?: number | null;
}

/**
 * Difficulty statistics interface
 * @interface DifficultyStat
 * @description Processed difficulty statistics with numeric values
 * Extends DifficultyStats from core/types with additional averageTime field
 */
export interface DifficultyStat extends DifficultyStats {
	averageTime: number;
}

/**
 * Time statistics raw result interface (raw from database)
 * @interface TimeStat
 * @description Raw result from time statistics query
 */
export interface TimeStat {
	averageTime: number | null;
	medianTime: number | null;
}

/**
 * Statistics item interface
 * @interface StatisticsItem
 * @description Common structure for statistics items with count and average
 */
export interface StatisticsItem {
	topic?: string;
	difficulty?: string;
	count: number;
	averageScore: number;
}

/**
 * Topic stats interface
 * @interface TopicStats
 * @description Common structure for topic statistics
 */
export interface TopicStats {
	name: string;
	totalGames: number;
	averageCorrectAnswers: number;
	averageTimeSpent: number;
}

/**
 * Analytics event data interface
 * @interface AnalyticsEventData
 * @description Data structure for analytics events
 */
export interface AnalyticsEventData {
	eventType: string;
	userId?: string;
	sessionId?: string;
	timestamp: Date;
	page?: string;
	action?: string;
	result?: 'success' | 'failure' | 'error';
	duration?: number;
	value?: number;
	properties?: Record<string, BasicValue>;
}

/**
 * Analytics metadata interface
 * @interface AnalyticsMetadata
 * @description Metadata specific to analytics events
 */
export interface AnalyticsMetadata {
	eventType?: string;
	sessionId?: string;
	page?: string;
	action?: string;
	result?: 'success' | 'failure' | 'error';
	duration?: number;
	value?: number;
	environment?: 'development' | 'staging' | 'production' | 'test';
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	// Provider-specific analytics fields
	questions?: {
		id: string;
		topic: string;
		difficulty: string;
		responseTime: number;
		timestamp: Date;
	}[];
	errors?: {
		timestamp: Date;
		provider: string;
	}[];
}

/**
 * Question analytics interface
 * @interface QuestionAnalytics
 * @description Analytics data for individual questions
 */
export interface QuestionAnalytics {
	id?: string;
	questionId?: string;
	question?: string;
	topic: string;
	difficulty: string;
	difficultyLevel?: string;
	answerCount: number;
	totalAttempts: number;
	correctCount: number;
	correctAttempts: number;
	successRate: number;
	averageTimeToAnswer: number;
	averageTime: number;
	complexityScore: number;
}

/**
 * Topic analytics interface
 * @interface TopicAnalytics
 * @description Analytics data for topics
 */
export interface TopicAnalytics {
	topic: string;
	totalQuestions: number;
	successRate: number;
	correctAnswers: number;
	mostDifficultQuestion: string;
	easiestQuestion: string;
	averageTime: number;
	difficultyBreakdown: Record<string, number>;
}

/**
 * User analytics interface
 * @interface UserAnalytics
 * @description Analytics data for users
 */
export interface UserAnalytics extends BaseGameStatistics {
	userId: string;
	correctAnswers: number;
	favoriteTopic: string;
	averageTimePerQuestion: number;
	totalPoints: number;
	topicsPlayed: Record<string, number>;
	difficultyBreakdown: Record<string, DifficultyStats>;
	recentActivity: ActivityEntry[];
}

/**
 * User analytics stats interface for database queries
 * @interface UserAnalyticsStats
 * @description Raw analytics data from database queries - UserAnalytics without userId
 */
export interface UserAnalyticsStats extends BaseGameStatistics {
	correctAnswers: number;
	favoriteTopic: string;
	averageTimePerQuestion: number;
	totalPoints: number;
	topicsPlayed: Record<string, number>;
	difficultyBreakdown: Record<string, DifficultyStats>;
	recentActivity: ActivityEntry[];
}

/**
 * System stats interface
 * @interface SystemStats
 * @description System-level statistics
 */
export interface SystemStats {
	totalUsers: number;
	activeUsers24h: number;
	activeUsers: number;
	totalQuestionsGenerated: number;
	totalQuestions: number;
	uptime: number;
	averageResponseTime: number;
	errorRate: number;
}

/**
 * System stats query interface for database queries
 * @interface SystemStatsQuery
 * @description Query parameters for system statistics
 */
export interface SystemStatsQuery {
	startDate?: string;
	endDate?: string;
	includeInactive?: boolean;
}

/**
 * Game analytics query interface
 * @interface GameAnalyticsQuery
 * @description Query parameters for game analytics
 */
export interface GameAnalyticsQuery {
	startDate?: string;
	endDate?: string;
	topic?: string;
	difficulty?: string;
	includeDetailedStats?: boolean;
}

/**
 * Game analytics stats interface for database queries
 * @interface GameAnalyticsStats
 * @description Raw game analytics data from database queries
 */
export interface GameAnalyticsStats
	extends Record<
		string,
		{
			total: number;
			correct: number;
			successRate: number;
		}
	> {}

/**
 * Game statistics data interface
 * @interface GameStatsData
 * @description Data structure for game statistics analytics
 */
export interface GameStatsData {
	totalGames: number;
	totalQuestions: number;
	averageScore: number;
	popularTopics: string[];
	difficultyDistribution: Record<string, number>;
	timeStats: TimeStat;
}

/**
 * Detailed game statistics interface
 * @interface GameStatistics
 * @description Detailed game statistics for client-side display with breakdown by topics and difficulties
 */
export interface GameStatistics {
	totalGames: number;
	averageScore: number;
	bestScore: number;
	worstScore: number;
	totalTimeSpent: number;
	averageTimePerGame: number;
	correctAnswers: number;
	wrongAnswers: number;
	accuracy: number;
	topics: StatisticsItem[];
	difficulties: StatisticsItem[];
}

/**
 * Topic statistics data interface
 * @interface TopicStatsData
 * @description Data structure for topic statistics analytics
 */
export interface TopicStatsData {
	topics: TopicStats[];
	totalTopics: number;
}

/**
 * Difficulty statistics data interface
 * @interface DifficultyStatsData
 * @description Data structure for difficulty statistics analytics
 * Uses DifficultyStat (extends DifficultyStats) for analytics-specific fields
 */
export interface DifficultyStatsData {
	difficulties: Record<string, DifficultyStat>;
	totalQuestions: number;
}

/**
 * Analytics response interface
 * @interface AnalyticsResponse
 * @description Generic analytics response structure
 */
export interface AnalyticsResponse<T = AnalyticsEventData> {
	data: T;
	metadata?: {
		total?: number;
		page?: number;
		pageSize?: number;
		hasMore?: boolean;
	};
	timestamp: string;
}

/**
 * User analytics query interface
 * @interface UserAnalyticsQuery
 * @description Query parameters for user analytics
 */
export interface UserAnalyticsQuery {
	startDate?: string;
	endDate?: string;
	includeGameHistory?: boolean;
	includePerformance?: boolean;
	includeTopicBreakdown?: boolean;
}

/**
 * User basic information interface
 * @interface UserBasicInfo
 * @description Basic user information for analytics
 */
export interface UserBasicInfo {
	userId: string;
	username: string;
	credits: number;
	purchasedPoints: number;
	totalPoints: number;
	createdAt: Date;
	accountAge: number;
}

/**
 * User game analytics interface
 * @interface UserGameAnalytics
 * @description Game analytics data for users - analytics metrics without user identification and financial data
 */
export interface UserGameAnalytics extends BaseGameStatistics {
	correctAnswers: number;
	averageTimePerQuestion: number;
	topicsPlayed: Record<string, number>;
	difficultyBreakdown: Record<string, { total: number; correct: number; successRate: number }>;
	recentActivity: ActivityEntry[];
}

/**
 * User performance metrics interface
 * @interface UserPerformanceMetrics
 * @description Performance metrics for user analytics
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
 * User ranking data interface (without userId)
 * @type UserRankingData
 * @description User ranking information without userId - alias for UserRankData without userId
 * @deprecated Use UserRankData from game.types.ts instead
 */
export type UserRankingData = Omit<UserRankData, 'userId'>;

/**
 * User Analytics Data Interface
 * @interface CompleteUserAnalytics
 * @description Complete user analytics data combining basic user info with game analytics
 */
export interface CompleteUserAnalytics {
	basic: UserBasicInfo;
	game: UserGameAnalytics;
	performance: UserPerformanceMetrics;
	ranking: UserRankingData;
}

/**
 * User progress topic analytics
 * @interface UserProgressTopic
 * @description Aggregated analytics per topic for a specific user
 */
export interface UserProgressTopic {
	topic: string;
	gamesPlayed: number;
	totalQuestions: number;
	correctAnswers: number;
	successRate: number;
	averageResponseTime: number;
	lastPlayed: string | null;
	difficultyBreakdown: Record<string, number>;
}

/**
 * User trend timeline point
 * @interface UserTrendPoint
 * @description Represents a single point in the user's performance timeline
 */
export interface UserTrendPoint {
	date: string;
	score: number;
	successRate: number;
	totalQuestions: number;
	correctAnswers: number;
	topic?: string;
	difficulty?: string;
}

/**
 * User progress analytics
 * @interface UserProgressAnalytics
 * @description Combined progress information for a specific user
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
 * @interface UserInsightsData
 * @description Insights and highlights for a user
 */
export interface UserInsightsData {
	strengths: string[];
	improvements: string[];
	recentHighlights: string[];
}

/**
 * User comparison metrics
 * @interface UserComparisonMetrics
 * @description Metrics used when comparing users
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
 * @interface UserComparisonResult
 * @description Comparison between a user and another user or global aggregate
 */
export interface UserComparisonResult {
	userId: string;
	target: 'global' | 'user';
	targetUserId?: string;
	userMetrics: UserComparisonMetrics;
	targetMetrics: UserComparisonMetrics;
	differences: UserComparisonMetrics;
}

/**
 * User summary data
 * @interface UserSummaryData
 * @description Summary block for user analytics dashboards
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

/**
 * Analytics Answer Data Interface
 * @interface AnalyticsAnswerData
 * @description Data structure for tracking user answers
 */
export interface AnalyticsAnswerData {
	isCorrect: boolean;
	timeSpent: number;
	topic?: string;
	difficulty?: string;
	selectedAnswer?: string;
	correctAnswer?: string;
}

/**
 * System insights interface
 * @interface SystemInsights
 * @description System insights data structure for analytics service
 * @used_by server/src/features/analytics/analytics.service.ts
 */
export interface SystemInsights {
	performanceInsights: string[];
	securityInsights: string[];
	userBehaviorInsights: string[];
	systemHealthInsights: string[];
	status: string;
	trends: string[];
	timestamp: Date;
}

/**
 * Business metrics revenue interface
 * @interface BusinessMetricsRevenue
 * @description Revenue metrics for business analytics
 */
export interface BusinessMetricsRevenue {
	total: number;
	mrr: number;
	arpu: number;
}

/**
 * Business metrics users interface
 * @interface BusinessMetricsUsers
 * @description User metrics for business analytics
 */
export interface BusinessMetricsUsers {
	total: number;
	active: number;
	newThisMonth: number;
	churnRate: number;
}

/**
 * Business metrics engagement interface
 * @interface BusinessMetricsEngagement
 * @description Engagement metrics for business analytics
 */
export interface BusinessMetricsEngagement {
	dau: number;
	wau: number;
	mau: number;
	avgSessionDuration: number;
}

/**
 * Business metrics interface
 * @interface BusinessMetrics
 * @description Business metrics data structure for analytics service
 * @used_by server/src/features/analytics/analytics.service.ts
 */
export interface BusinessMetrics {
	revenue: BusinessMetricsRevenue;
	users: BusinessMetricsUsers;
	engagement: BusinessMetricsEngagement;
}

/**
 * System recommendation interface
 * @interface SystemRecommendation
 * @description System recommendation data structure for analytics service
 * @used_by server/src/features/analytics/analytics.service.ts
 */
export interface SystemRecommendation {
	id: string;
	type: string;
	title: string;
	description: string;
	message: string;
	action: string;
	priority: string;
	estimatedImpact: string;
	implementationEffort: string;
}
