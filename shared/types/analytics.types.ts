/**
 * Analytics-related types for EveryTriv
 *
 * @module AnalyticsTypes
 * @description Type definitions for analytics and metrics data structures
 * @used_by server: server/src/features/analytics/analytics.service.ts (analytics data), client: client/src/components/stats/StatsCharts.tsx (chart data), server/src/features/metrics/metrics.service.ts (metrics collection)
 */
import type { BaseMetadata } from './metadata.types';

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
	properties?: Record<string, string | number | boolean>;
}

/**
 * Analytics metadata interface
 * @interface AnalyticsMetadata
 * @description Metadata specific to analytics events
 */
export interface AnalyticsMetadata {
	eventType?: string;
	userId?: string;
	sessionId?: string;
	page?: string;
	action?: string;
	result?: 'success' | 'failure' | 'error';
	duration?: number;
	value?: number;
	source?: 'web' | 'mobile' | 'api';
	// Server-specific analytics fields
	version?: string;
	environment?: 'development' | 'staging' | 'production';
	userAgent?: string;
	ipAddress?: string;
	referrer?: string;
	campaign?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	customFields?: Record<string, string | number | boolean>;
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
 * Question statistics interface
 * @interface QuestionStats
 * @description Comprehensive statistics for trivia questions
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getQuestionStats)
 */
export interface QuestionStats {
	/** Total number of questions */
	totalQuestions: number;
	/** Questions by topic */
	byTopic: Record<string, number>;
	/** Questions by difficulty */
	byDifficulty: Record<string, number>;
	/** Average number of answers per question */
	averageAnswerCount: number;
	/** Question quality score (0-100) */
	questionQualityScore: number;
	/** Duplicate rate percentage */
	duplicateRate: number;
}

/**
 * Performance metrics interface
 * @interface PerformanceMetrics
 * @description System performance and monitoring metrics
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getPerformanceMetrics)
 */
export interface PerformanceMetrics {
	/** Average response time in milliseconds */
	responseTime: number;
	/** Memory usage in bytes */
	memoryUsage: number;
	/** CPU usage in microseconds */
	cpuUsage: number;
	/** Error rate percentage */
	errorRate: number;
	/** Total requests processed */
	throughput: number;
	/** Server uptime in seconds */
	uptime: number;
	/** Number of active connections */
	activeConnections: number;
}

/**
 * Analytics insights interface
 * @interface AnalyticsInsights
 * @description Insights derived from analytics data
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getAnalyticsInsights)
 */
export interface AnalyticsInsights {
	/** Quality-related insights */
	qualityInsights: string[];
	/** Performance-related insights */
	performanceInsights: string[];
	/** Topic-related insights */
	topicInsights: string[];
}

/**
 * Question cache entry interface
 * @interface QuestionCacheEntry
 * @description Cache entry for trivia questions
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils cache management)
 */
export interface QuestionCacheEntry {
	/** Cached question data */
	question: {
		id?: string;
		question: string;
		answers: string[];
		correctAnswerIndex?: number;
		difficulty?: string;
		topic?: string;
	};
	/** Creation timestamp */
	created_at: Date;
	/** Number of times accessed */
	accessCount: number;
	/** Last access timestamp */
	lastAccessed: Date;
}

/**
 * Cache statistics interface
 * @interface CacheStats
 * @description Statistics for question cache
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getCacheStats)
 */
export interface CacheStats {
	/** Total cache size */
	size: number;
	/** Cache hit rate percentage */
	hitRate: number;
	/** Most accessed cache entries */
	mostAccessed: QuestionCacheEntry[];
}

/**
 * Answer balance analysis interface
 * @interface AnswerBalanceAnalysis
 * @description Analysis of answer distribution and balance
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.analyzeAnswerBalance)
 */
export interface AnswerBalanceAnalysis {
	/** Whether answers are well-balanced */
	isBalanced: boolean;
	/** Balance score (0-100) */
	balanceScore?: number;
	/** Issues found with answer distribution */
	issues?: string[];
}

/**
 * Question complexity analysis interface
 * @interface QuestionComplexityAnalysis
 * @description Analysis of question complexity
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.calculateQuestionComplexity)
 */
export interface QuestionComplexityAnalysis {
	/** Complexity score (0-10) */
	complexityScore: number;
	/** Factors contributing to complexity */
	factors: {
		/** Question length factor */
		questionLength: number;
		/** Answer count factor */
		answerCount: number;
		/** Answer variance factor */
		answerVariance: number;
	};
	/** Overall complexity level */
	level: 'low' | 'medium' | 'high';
}

/**
 * Answer position statistics interface
 * @interface AnswerPositionStats
 * @description Statistics about correct answer positions
 * @used_by server/src/shared/utils/trivia.utils.ts (ServerUtils.getAnswerPositionStats)
 */
export interface AnswerPositionStats {
	/** Count of correct answers in each position */
	positionCounts: Record<number, number>;
	/** Total questions analyzed */
	totalQuestions: number;
	/** Position bias score (0-1, higher means more bias) */
	biasScore: number;
	/** Whether position distribution is balanced */
	isBalanced: boolean;
}

/**
 * Question analytics interface
 * @interface QuestionAnalytics
 * @description Analytics data for individual questions
 */
export interface QuestionAnalytics {
	/** Question ID */
	questionId: string;
	/** Question text */
	question: string;
	/** Topic */
	topic: string;
	/** Difficulty level */
	difficulty: string;
	/** Difficulty level (alias) */
	difficultyLevel: string;
	/** Number of times answered */
	answerCount: number;
	/** Total attempts (alias) */
	totalAttempts: number;
	/** Number of correct answers */
	correctCount: number;
	/** Correct attempts (alias) */
	correctAttempts: number;
	/** Success rate percentage */
	successRate: number;
	/** Average time to answer in seconds */
	averageTimeToAnswer: number;
	/** Average time (alias) */
	averageTime: number;
	/** Complexity score */
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
	/** Recent activity */
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
	/** Recent activity */
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
 * System insights interface
 * @interface SystemInsights
 * @description System-level insights and recommendations
 */
export interface SystemInsights {
	/** Performance insights */
	performanceInsights: string[];
	/** Security insights */
	securityInsights: string[];
	/** User behavior insights */
	userBehaviorInsights: string[];
	/** System health insights */
	systemHealthInsights: string[];
	/** System status */
	status: 'healthy' | 'warning' | 'critical' | 'good' | 'optimal';
	trends: string[];
	/** Timestamp */
	timestamp: Date;
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
 * Security metrics interface
 * @interface SecurityMetrics
 * @description Security-related metrics
 */
export interface SecurityMetrics {
	/** Authentication metrics */
	authentication: {
		/** Failed login attempts */
		failedLogins: number;
		/** Successful logins */
		successfulLogins: number;
		/** Account lockouts */
		accountLockouts: number;
	};
	/** Authorization metrics */
	authorization: {
		/** Unauthorized access attempts */
		unauthorizedAttempts: number;
		/** Permission violations */
		permissionViolations: number;
	};
	/** Data security metrics */
	dataSecurity: {
		/** Data breaches */
		dataBreaches: number;
		/** Data encryption coverage */
		encryptionCoverage: number;
		/** Backup success rate */
		backupSuccessRate: number;
	};
}

// AnalyticsEventData is already defined above

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
export interface GameAnalyticsStats {
	[key: string]: {
		total: number;
		correct: number;
		successRate: number;
	};
}

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
 * Provider metrics interface
 * @interface ProviderMetrics
 * @description Metrics for AI providers
 * @extends BaseMetadata
 */
export interface ProviderMetrics extends BaseMetadata {
	/** Provider name */
	providerName: string;
	/** Total requests */
	totalRequests: number;
	/** Successful requests */
	successfulRequests: number;
	/** Failed requests */
	failedRequests: number;
	/** Average response time */
	averageResponseTime: number;
	/** Success rate percentage */
	successRate: number;
	/** Error rate percentage */
	errorRate: number;
	/** Last used timestamp */
	lastUsed?: string;
	/** Current status */
	status: 'available' | 'unavailable' | 'error';
}

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Health status for AI providers
 * @extends BaseMetadata
 */
export interface ProviderHealth extends BaseMetadata {
	/** Provider name */
	providerName: string;
	/** Health status */
	status: 'healthy' | 'unhealthy' | 'degraded';
	/** Response time in milliseconds */
	responseTime?: number;
	/** Error count */
	errorCount: number;
	/** Success count */
	successCount: number;
	/** Last health check */
	lastCheck: string;
	/** Error message if unhealthy */
	errorMessage?: string;
	/** Provider configuration */
	config?: {
		model?: string;
		version?: string;
		rateLimit?: {
			requestsPerMinute: number;
			tokensPerMinute: number;
		};
	};
}
