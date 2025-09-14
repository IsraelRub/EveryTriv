/**
 * Analytics-related types for EveryTriv
 *
 * @module AnalyticsTypes
 * @description Type definitions for analytics and metrics data structures
 * @used_by server/src/features/analytics/analytics.service.ts, client/src/components/stats/StatsCharts.tsx, server/src/features/metrics/metrics.service.ts
 */
import { BasicValue } from '../../core/data.types';

/**
 * Question cache entry interface
 * @interface QuestionCacheEntry
 * @description Cache entry for trivia questions
 */
export interface QuestionCacheEntry {
	question: {
		question: string;
		answers: string[];
		correctAnswerIndex: number;
		difficulty: string;
		topic: string;
	};
	created_at: Date;
	accessCount: number;
	lastAccessed: Date;
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
	questions?: Array<{
		id: string;
		topic: string;
		difficulty: string;
		responseTime: number;
		timestamp: Date;
	}>;
	errors?: Array<{
		timestamp: Date;
		provider: string;
	}>;
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
	/** Topic name */
	topic: string;
	/** Total questions in topic */
	totalQuestions: number;
	/** Average success rate */
	averageSuccessRate: number;
	/** Success rate (alias) */
	successRate: number;
	/** Correct answers count */
	correctAnswers: number;
	/** Most difficult question */
	mostDifficultQuestion: string;
	/** Easiest question */
	easiestQuestion: string;
	/** Average time to answer */
	averageTimeToAnswer: number;
	/** Average time (alias) */
	averageTime: number;
	/** Difficulty breakdown */
	difficultyBreakdown: Record<string, number>;
}

/**
 * User analytics interface
 * @interface UserAnalytics
 * @description Analytics data for users
 */
export interface UserAnalytics {
	/** User ID */
	userId: string;
	/** Total questions answered */
	totalQuestionsAnswered: number;
	/** Total questions (alias) */
	totalQuestions: number;
	/** Total correct answers */
	totalCorrectAnswers: number;
	/** Correct answers (alias) */
	correctAnswers: number;
	/** Overall success rate */
	overallSuccessRate: number;
	/** Success rate (alias) */
	successRate: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Average time per question */
	averageTimePerQuestion: number;
	/** Average response time */
	averageResponseTime: number;
	/** Total points */
	totalPoints: number;
	/** Topics played */
	topicsPlayed: Record<string, number>;
	/** Difficulty breakdown */
	difficultyBreakdown: Record<string, { total: number; correct: number; successRate: number }>;
	recentActivity: Array<{
		date: Date;
		action: string;
		detail?: string;
		topic?: string;
		durationSeconds?: number;
	}>;
	/** Total play time in minutes */
	totalPlayTime: number;
}

/**
 * User analytics stats interface for database queries
 * @interface UserAnalyticsStats
 * @description Raw analytics data from database queries
 */
export interface UserAnalyticsStats {
	/** Total questions */
	totalQuestions: number;
	/** Correct answers */
	correctAnswers: number;
	/** Success rate */
	successRate: number;
	/** Favorite topic */
	favoriteTopic: string;
	/** Average time */
	averageTime: number;
	/** Total points */
	totalPoints: number;
	/** Topics played */
	topicsPlayed: Record<string, number>;
	/** Difficulty breakdown */
	difficultyBreakdown: Record<string, { total: number; correct: number; successRate: number }>;
	recentActivity: Array<{
		date: Date;
		action: string;
		detail?: string;
		topic?: string;
		durationSeconds?: number;
	}>;
	/** Total play time */
	totalPlayTime: number;
}

/**
 * System stats interface
 * @interface SystemStats
 * @description System-level statistics
 */
export interface SystemStats {
	/** Total users */
	totalUsers: number;
	/** Active users in last 24 hours */
	activeUsers24h: number;
	/** Active users (alias for activeUsers24h) */
	activeUsers: number;
	/** Total questions generated */
	totalQuestionsGenerated: number;
	/** Total questions (alias) */
	totalQuestions: number;
	/** System uptime in seconds */
	uptime: number;
	/** Average response time */
	averageResponseTime: number;
	/** Error rate percentage */
	errorRate: number;
}

/**
 * System stats query interface for database queries
 * @interface SystemStatsQuery
 * @description Query parameters for system statistics
 */
export interface SystemStatsQuery {
	/** Time range start */
	startDate?: string;
	/** Time range end */
	endDate?: string;
	/** Include inactive users */
	includeInactive?: boolean;
}

/**
 * Game analytics query interface
 * @interface GameAnalyticsQuery
 * @description Query parameters for game analytics
 */
export interface GameAnalyticsQuery {
	/** Time range start */
	startDate?: string;
	/** Time range end */
	endDate?: string;
	/** Topic filter */
	topic?: string;
	/** Difficulty filter */
	difficulty?: string;
	/** Include detailed stats */
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
	/** Total number of games */
	totalGames: number;
	/** Total number of questions */
	totalQuestions: number;
	/** Average score */
	averageScore: number;
	/** Popular topics */
	popularTopics: string[];
	/** Difficulty distribution */
	difficultyDistribution: Record<string, number>;
	/** Time statistics */
	timeStats: {
		averageTime: number;
		medianTime: number;
	};
}

/**
 * Topic statistics data interface
 * @interface TopicStatsData
 * @description Data structure for topic statistics analytics
 */
export interface TopicStatsData {
	/** Topics data */
	topics: Array<{
		name: string;
		totalGames: number;
		averageCorrectAnswers: number;
		averageTimeSpent: number;
	}>;
	/** Total number of topics */
	totalTopics: number;
}

/**
 * Difficulty statistics data interface
 * @interface DifficultyStatsData
 * @description Data structure for difficulty statistics analytics
 */
export interface DifficultyStatsData {
	/** Difficulties data */
	difficulties: Record<
		string,
		{
			total: number;
			correct: number;
			averageTime: number;
		}
	>;
	/** Total number of questions */
	totalQuestions: number;
}

/**
 * Difficulty statistics interface
 * @interface DifficultyStats
 * @description Statistics for different difficulty levels
 * @used_by client/src/services/api.service.ts (getDifficultyStats), server/src/features/analytics/analytics.service.ts
 */
export interface DifficultyStats {
	[difficulty: string]: {
		correct: number;
		total: number;
	};
}

/**
 * User score data interface
 * @interface UserScoreData
 * @description User score data for leaderboards
 */
export interface UserScoreData {
	/** User ID */
	userId: string;
	/** Username */
	username: string;
	/** Score */
	score: number;
	/** Rank */
	rank: number;
	/** Total points */
	totalPoints: number;
	/** Games played */
	gamesPlayed: number;
	/** Success rate */
	successRate: number;
}

/**
 * Analytics response interface
 * @interface AnalyticsResponse
 * @description Generic analytics response structure
 */
export interface AnalyticsResponse<T = AnalyticsEventData> {
	/** Response data */
	data: T;
	/** Response metadata */
	metadata?: {
		/** Total count */
		total?: number;
		/** Page number */
		page?: number;
		/** Page size */
		pageSize?: number;
		/** Has more data */
		hasMore?: boolean;
	};
	/** Response timestamp */
	timestamp: string;
}

/**
 * User analytics query interface
 * @interface UserAnalyticsQuery
 * @description Query parameters for user analytics
 */
export interface UserAnalyticsQuery {
	/** Time range start */
	startDate?: string;
	/** Time range end */
	endDate?: string;
	/** Include game history */
	includeGameHistory?: boolean;
	/** Include performance metrics */
	includePerformance?: boolean;
	/** Include topic breakdown */
	includeTopicBreakdown?: boolean;
}

/**
 * User Analytics Data Interface
 * @interface CompleteUserAnalytics
 * @description Complete user analytics data combining basic user info with game analytics
 */
export interface CompleteUserAnalytics {
	/** Basic user information */
	basic: {
		userId: string;
		username: string;
		credits: number;
		purchasedPoints: number;
		totalPoints: number;
		created_at: Date;
		accountAge: number;
	};
	/** Game analytics data */
	game: {
		totalGames: number;
		totalQuestions: number;
		correctAnswers: number;
		successRate: number;
		averageTimePerQuestion: number;
		topicsPlayed: Record<string, number>;
		difficultyBreakdown: Record<string, { total: number; correct: number; successRate: number }>;
		recentActivity: Array<{
			date: Date;
			action: string;
			detail?: string;
			topic?: string;
			durationSeconds?: number;
		}>;
		totalPlayTime: number;
	};
	/** Performance metrics */
	performance: {
		lastPlayed: Date;
		streakDays: number;
		bestStreak: number;
		improvementRate: number;
		weakestTopic: string;
		strongestTopic: string;
		averageGameTime?: number;
		consistencyScore?: number;
		learningCurve?: number;
	};
	/** Ranking information */
	ranking: {
		rank: number;
		score: number;
		percentile: number;
		totalUsers: number;
	};
}

/**
 * Analytics Answer Data Interface
 * @interface AnalyticsAnswerData
 * @description Data structure for tracking user answers
 */
export interface AnalyticsAnswerData {
	/** Whether the answer was correct */
	isCorrect: boolean;
	/** Time spent on the question in seconds */
	timeSpent: number;
	/** Question topic */
	topic?: string;
	/** Question difficulty */
	difficulty?: string;
	/** Answer selected */
	selectedAnswer?: string;
	/** Correct answer */
	correctAnswer?: string;
}
