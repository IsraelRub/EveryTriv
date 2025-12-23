/**
 * Metrics Types (server-only)
 * @module ServerMetricsTypes
 * @description Metrics-related type definitions
 */

/**
 * Middleware metrics interface
 * @interface MiddlewareMetrics
 * @description Performance metrics for middleware components
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
	lastErrorMessage?: string;
	lastErrorName?: string;
	lastErrorTimestamp?: Date;
}

/**
 * System performance metrics interface
 * @interface SystemPerformanceMetrics
 * @description System-wide performance and monitoring metrics
 */
export interface SystemPerformanceMetrics {
	responseTime: number;
	memoryUsage: number;
	cpuUsage: number;
	errorRate: number;
	throughput: number;
	uptime: number;
	activeConnections: number;
}

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
