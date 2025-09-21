/**
 * Analytics-related types for EveryTriv
 *
 * @module AnalyticsTypes
 * @description Type definitions for analytics and metrics data structures
 * @used_by server/src/features/analytics/analytics.service.ts
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
	topic: string;
	totalQuestions: number;
	averageSuccessRate: number;
	successRate: number;
	correctAnswers: number;
	mostDifficultQuestion: string;
	easiestQuestion: string;
	averageTimeToAnswer: number;
	averageTime: number;
	difficultyBreakdown: Record<string, number>;
}

/**
 * User analytics interface
 * @interface UserAnalytics
 * @description Analytics data for users
 */
export interface UserAnalytics {
	userId: string;
	totalQuestionsAnswered: number;
	totalQuestions: number;
	totalCorrectAnswers: number;
	correctAnswers: number;
	overallSuccessRate: number;
	successRate: number;
	favoriteTopic: string;
	averageTimePerQuestion: number;
	averageResponseTime: number;
	totalPoints: number;
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
}

/**
 * User analytics stats interface for database queries
 * @interface UserAnalyticsStats
 * @description Raw analytics data from database queries
 */
export interface UserAnalyticsStats {
	totalQuestions: number;
	correctAnswers: number;
	successRate: number;
	favoriteTopic: string;
	averageTime: number;
	totalPoints: number;
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
	topics: Array<{
		name: string;
		totalGames: number;
		averageCorrectAnswers: number;
		averageTimeSpent: number;
	}>;
	totalTopics: number;
}

/**
 * Difficulty statistics data interface
 * @interface DifficultyStatsData
 * @description Data structure for difficulty statistics analytics
 */
export interface DifficultyStatsData {
	difficulties: Record<
		string,
		{
			total: number;
			correct: number;
			averageTime: number;
		}
	>;
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
	userId: string;
	username: string;
	score: number;
	rank: number;
	totalPoints: number;
	gamesPlayed: number;
	successRate: number;
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
 * User Analytics Data Interface
 * @interface CompleteUserAnalytics
 * @description Complete user analytics data combining basic user info with game analytics
 */
export interface CompleteUserAnalytics {
	basic: {
		userId: string;
		username: string;
		credits: number;
		purchasedPoints: number;
		totalPoints: number;
		created_at: Date;
		accountAge: number;
	};
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
	isCorrect: boolean;
	timeSpent: number;
	topic?: string;
	difficulty?: string;
	selectedAnswer?: string;
	correctAnswer?: string;
}
