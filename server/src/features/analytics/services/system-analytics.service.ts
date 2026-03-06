import { cpus, freemem, totalmem } from 'os';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { SYSTEM_HEALTH_THRESHOLDS, TIME_PERIODS_MS } from '@shared/constants';
import type { SecurityMetrics, SystemInsights, SystemPerformanceMetrics, SystemRecommendation } from '@shared/types';
import { calculatePercentage, getErrorMessage, mean, sum } from '@shared/utils';

import { serverLogger as logger, metricsService } from '@internal/services';

@Injectable()
export class SystemAnalyticsService implements OnModuleInit, OnModuleDestroy {
	private performanceData: SystemPerformanceMetrics = {
		responseTime: 0,
		memoryUsage: 0,
		cpuUsage: 0,
		errorRate: 0,
		throughput: 0,
		uptime: 0,
	};

	private securityData: SecurityMetrics = {
		authentication: {
			failedLogins: 0,
			successfulLogins: 0,
			accountLockouts: 0,
		},
		authorization: {
			unauthorizedAttempts: 0,
			permissionViolations: 0,
		},
		dataSecurity: {
			dataBreaches: 0,
			encryptionCoverage: 100,
			backupSuccessRate: 100,
		},
	};

	private startTime = Date.now();
	private totalRequests = 0;
	private failedRequests = 0;
	private responseTimes: number[] = [];
	private metricsCollectionInterval: NodeJS.Timeout | null = null;

	onModuleInit() {
		this.startMetricsCollection();
	}

	onModuleDestroy() {
		if (this.metricsCollectionInterval) {
			clearInterval(this.metricsCollectionInterval);
		}
	}

	async getPerformanceMetrics(): Promise<SystemPerformanceMetrics> {
		try {
			await this.updatePerformanceMetrics();
			return this.performanceData;
		} catch (error) {
			logger.analyticsError('getPerformanceMetrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getSecurityMetrics(): Promise<SecurityMetrics> {
		try {
			return this.securityData;
		} catch (error) {
			logger.analyticsError('getSecurityMetrics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getSystemRecommendations(): Promise<SystemRecommendation[]> {
		try {
			const recommendations: SystemRecommendation[] = [];

			if (this.performanceData.responseTime > 2000) {
				recommendations.push({
					id: 'perf-001',
					type: 'performance',
					title: 'High Response Time',
					description: `Server response time is ${this.performanceData.responseTime}ms, above optimal levels`,
					message: 'Consider optimizing database queries or adding caching',
					action: 'Review slow query logs and optimize frequently accessed endpoints',
					priority: 'high',
					estimatedImpact: 'Improve user experience and reduce server load',
					implementationEffort: 'medium',
				});
			}

			if (this.securityData.authentication.failedLogins > SYSTEM_HEALTH_THRESHOLDS.FAILED_LOGINS_ATTENTION_COUNT) {
				recommendations.push({
					id: 'sec-001',
					type: 'security',
					title: 'High Failed Login Attempts',
					description: `There have been ${this.securityData.authentication.failedLogins} failed login attempts`,
					message: 'Consider implementing rate limiting or CAPTCHA',
					action: 'Review authentication logs and implement additional security measures',
					priority: 'high',
					estimatedImpact: 'Reduce risk of brute force attacks',
					implementationEffort: 'low',
				});
			}

			if (this.performanceData.memoryUsage > SYSTEM_HEALTH_THRESHOLDS.MEMORY_USAGE_RECOMMENDATION_PERCENT) {
				recommendations.push({
					id: 'perf-002',
					type: 'performance',
					title: 'High Memory Usage',
					description: `Server memory usage is ${this.performanceData.memoryUsage.toFixed(1)}%, approaching capacity`,
					message: 'Consider optimizing memory usage or scaling resources',
					action: 'Review memory-intensive operations and optimize data structures',
					priority: 'medium',
					estimatedImpact: 'Prevent memory leaks and improve system stability',
					implementationEffort: 'medium',
				});
			}

			if (this.performanceData.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT) {
				recommendations.push({
					id: 'perf-003',
					type: 'performance',
					title: 'High Error Rate',
					description: `Error rate is ${this.performanceData.errorRate.toFixed(2)}%, above acceptable threshold`,
					message: 'Review error logs and address common failure points',
					action: 'Investigate and fix recurring errors, improve error handling',
					priority: 'high',
					estimatedImpact: 'Improve system reliability and user experience',
					implementationEffort: 'high',
				});
			}

			return recommendations;
		} catch (error) {
			logger.analyticsError('getSystemRecommendations', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	getSystemInsights(): SystemInsights {
		const metrics = metricsService.getMetrics();
		const perf = this.performanceData;
		const sec = this.securityData;

		const performanceInsights = [
			perf.responseTime > 0 ? `Average response time: ${Math.round(perf.responseTime)}ms` : 'Response time pending',
			perf.throughput >= 0 ? `Throughput: ${perf.throughput.toFixed(2)} req/s` : 'Throughput pending',
			this.totalRequests > 0
				? `Error rate: ${perf.errorRate.toFixed(2)}% (${this.failedRequests}/${this.totalRequests} failed)`
				: 'Error rate: no requests yet',
		];

		const securityInsights = [
			`Successful logins: ${sec.authentication.successfulLogins}`,
			`Failed logins: ${sec.authentication.failedLogins}`,
			`Unauthorized attempts: ${sec.authorization.unauthorizedAttempts}`,
			`Data encryption coverage: ${sec.dataSecurity.encryptionCoverage}%`,
		];

		const userBehaviorInsights = ['User behavior metrics are available via Analytics and Business endpoints.'];

		const hitRate = metrics.performance?.hitRate ?? 0;
		const missRate = metrics.performance?.missRate ?? 0;
		const totalOps = metrics.totalOps ?? 0;
		const successRate = metricsService.getOverallSuccessRate();
		const systemHealthInsights = [
			totalOps > 0 ? `Cache hit rate: ${(hitRate * 100).toFixed(1)}%` : 'Cache metrics pending',
			totalOps > 0 ? `Cache miss rate: ${(missRate * 100).toFixed(1)}%` : null,
			totalOps > 0 ? `Storage success rate: ${successRate.toFixed(1)}%` : null,
			`Total storage ops: ${totalOps}`,
		].filter((s): s is string => typeof s === 'string');

		const status =
			perf.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT ||
			perf.memoryUsage > SYSTEM_HEALTH_THRESHOLDS.MEMORY_USAGE_ATTENTION_PERCENT ||
			sec.authentication.failedLogins > SYSTEM_HEALTH_THRESHOLDS.FAILED_LOGINS_ATTENTION_COUNT
				? 'attention'
				: 'optimal';

		return {
			performanceInsights,
			securityInsights,
			userBehaviorInsights,
			systemHealthInsights,
			status,
			trends: ['System insights driven by MetricsService and runtime data'],
			timestamp: new Date(),
		};
	}

	trackAuthenticationEvent(success: boolean): void {
		if (success) {
			this.securityData.authentication.successfulLogins += 1;
		} else {
			this.securityData.authentication.failedLogins += 1;
		}
	}

	trackAuthorizationEvent(authorized: boolean): void {
		if (!authorized) {
			this.securityData.authorization.unauthorizedAttempts += 1;
		}
	}

	trackPerformanceEvent(responseTime: number, success: boolean): void {
		this.responseTimes.push(responseTime);
		if (this.responseTimes.length > 100) {
			this.responseTimes.shift();
		}
		this.performanceData.responseTime = mean(this.responseTimes);

		this.totalRequests += 1;
		this.performanceData.throughput = this.totalRequests / ((Date.now() - this.startTime) / TIME_PERIODS_MS.SECOND);

		if (!success) {
			this.failedRequests += 1;
		}
		this.performanceData.errorRate = calculatePercentage(this.failedRequests, this.totalRequests);
	}

	private startMetricsCollection(): void {
		const collectMetrics = async () => {
			try {
				await this.updatePerformanceMetrics();
			} catch (error) {
				logger.analyticsError('startMetricsCollection', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}
		};
		this.metricsCollectionInterval = setInterval(collectMetrics, 5 * TIME_PERIODS_MS.MINUTE);
	}

	private async updatePerformanceMetrics(): Promise<void> {
		this.performanceData.uptime = Math.floor((Date.now() - this.startTime) / TIME_PERIODS_MS.SECOND);

		const totalMemory = totalmem();
		const freeMemory = freemem();
		this.performanceData.memoryUsage = calculatePercentage(totalMemory - freeMemory, totalMemory);

		const cpuList = cpus();
		let totalIdle = 0;
		let totalTick = 0;

		cpuList.forEach(cpu => {
			const timeValues = Object.values(cpu.times);
			totalTick += sum(timeValues);
			totalIdle += cpu.times.idle;
		});

		this.performanceData.cpuUsage = calculatePercentage(totalTick - totalIdle, totalTick);
	}
}
