/**
 * Performance metrics and monitoring types for EveryTriv
 *
 * @module MetricsTypes
 * @description Type definitions for performance metrics and monitoring
 * @used_by server: server/src/shared/utils/trivia.utils.ts (ServerUtils.getPerformanceMetrics), server/src/features/analytics/analytics.service.ts
 */
import type { BasicValue } from '../../core/data.types';

/**
 * Middleware metrics interface
 * @interface MiddlewareMetrics
 * @description Performance metrics for middleware components
 * @used_by server/src/internal/controllers/middleware-metrics.controller.ts
 */
export interface MiddlewareMetrics {
	/** Number of requests processed */
	requestCount: number;
	/** Total duration in milliseconds */
	totalDuration: number;
	/** Average duration in milliseconds */
	averageDuration: number;
	/** Minimum duration in milliseconds */
	minDuration: number;
	/** Maximum duration in milliseconds */
	maxDuration: number;
	/** Number of slow operations */
	slowOperations: number;
	/** Error count */
	errorCount: number;
	/** Last executed timestamp */
	lastExecuted: Date;
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
	mostAccessed: Array<Record<string, BasicValue>>;
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
 * Provider metrics interface
 * @interface ProviderMetrics
 * @description Metrics for AI providers
 * @extends BaseMetadata
 */

/**
 * Provider health interface
 * @interface ProviderHealth
 * @description Health status for AI providers
 * @extends BaseMetadata
 */

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
