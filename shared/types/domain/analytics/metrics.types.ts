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

export interface SystemPerformanceMetrics {
	responseTime: number;
	memoryUsage: number;
	cpuUsage: number;
	errorRate: number;
	throughput: number;
	uptime: number;
}

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
