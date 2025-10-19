/**
 * Performance metrics and monitoring types for EveryTriv
 *
 * @module MetricsTypes
 * @description Type definitions for performance metrics and monitoring
 * @used_by server/src/features/analytics/analytics.service.ts
 */
import type { BasicValue } from '../../core/data.types';

/**
 * Middleware metrics interface
 * @interface MiddlewareMetrics
 * @description Performance metrics for middleware components
 * @used_by server/src/internal/controllers/middleware-metrics.controller.ts
 */
export interface MiddlewareMetrics {
	requestCount: number;
	totalDuration: number;
	averageDuration: number;
	minDuration: number;
	maxDuration: number;
	slowOperations: number;
	errorCount: number;
	lastExecuted: Date;
}

/**
 * Question statistics interface
 * @interface QuestionStats
 * @description Comprehensive statistics for trivia questions
 * @used_by server/src/features/analytics
 */
export interface QuestionStats {
	totalQuestions: number;
	byTopic: Record<string, number>;
	byDifficulty: Record<string, number>;
	averageAnswerCount: number;
	questionQualityScore: number;
	duplicateRate: number;
}

/**
 * Performance metrics interface
 * @interface PerformanceMetrics
 * @description System performance and monitoring metrics
 * @used_by server/src/features/analytics
 */
export interface AnalyticsPerformanceMetrics {
	responseTime: number;
	memoryUsage: number;
	cpuUsage: number;
	errorRate: number;
	throughput: number;
	uptime: number;
	activeConnections: number;
}

/**
 * Cache statistics interface
 * @interface CacheStats
 * @description Statistics for question cache
 * @used_by server/src/features/analytics
 */
export interface AnalyticsCacheStats {
	size: number;
	hitRate: number;
	mostAccessed: Array<Record<string, BasicValue>>;
}

/**
 * Answer balance analysis interface
 * @interface AnswerBalanceAnalysis
 * @description Analysis of answer distribution and balance
 * @used_by server/src/features/analytics
 */
export interface AnswerBalanceAnalysis {
	isBalanced: boolean;
	balanceScore?: number;
	issues?: string[];
}

/**
 * Question complexity analysis interface
 * @interface QuestionComplexityAnalysis
 * @description Analysis of question complexity
 * @used_by server/src/features/analytics
 */
export interface QuestionComplexityAnalysis {
	complexityScore: number;
	factors: {
		questionLength: number;
		answerCount: number;
		answerVariance: number;
	};
	level: 'low' | 'medium' | 'high';
}

/**
 * Answer position statistics interface
 * @interface AnswerPositionStats
 * @description Statistics about correct answer positions
 * @used_by server/src/features/analytics
 */
export interface AnswerPositionStats {
	positionCounts: Record<number, number>;
	totalQuestions: number;
	biasScore: number;
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
	authentication: {
		failedLogins: number;
		successfulLogins: number;
		accountLockouts: number;
	};
	authorization: {
		unauthorizedAttempts: number;
		permissionViolations: number;
	};
	dataSecurity: {
		dataBreaches: number;
		encryptionCoverage: number;
		backupSuccessRate: number;
	};
}
