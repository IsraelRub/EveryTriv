import { cpus, freemem, totalmem } from 'os';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import {
	RecommendationPriority,
	SYSTEM_HEALTH_THRESHOLDS,
	SystemInsightStatus,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type { SecurityMetrics, SystemInsights, SystemPerformanceMetrics, SystemRecommendation } from '@shared/types';
import { calculatePercentage, getErrorMessage, mean, sum } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

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

	get securityMetrics(): SecurityMetrics {
		return this.securityData;
	}

	async getSystemRecommendations(): Promise<SystemRecommendation[]> {
		try {
			const recommendations: SystemRecommendation[] = [];

			if (this.performanceData.responseTime > TIME_PERIODS_MS.TWO_SECONDS) {
				const responseTimeMs = String(this.performanceData.responseTime);
				recommendations.push({
					id: 'perf-001',
					type: 'performance',
					priority: RecommendationPriority.HIGH,
					implementationEffort: 'medium',
					i18nParams: { responseTimeMs },
				});
			}

			if (this.securityData.authentication.failedLogins > SYSTEM_HEALTH_THRESHOLDS.FAILED_LOGINS_ATTENTION_COUNT) {
				const failedLogins = String(this.securityData.authentication.failedLogins);
				recommendations.push({
					id: 'sec-001',
					type: 'security',
					priority: RecommendationPriority.HIGH,
					implementationEffort: 'low',
					i18nParams: { failedLogins },
				});
			}

			if (this.performanceData.memoryUsage > SYSTEM_HEALTH_THRESHOLDS.MEMORY_USAGE_RECOMMENDATION_PERCENT) {
				const memoryUsage = this.performanceData.memoryUsage.toFixed(1);
				recommendations.push({
					id: 'perf-002',
					type: 'performance',
					priority: RecommendationPriority.MEDIUM,
					implementationEffort: 'medium',
					i18nParams: { memoryUsage },
				});
			}

			if (this.performanceData.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT) {
				const errorRate = this.performanceData.errorRate.toFixed(2);
				recommendations.push({
					id: 'perf-003',
					type: 'performance',
					priority: RecommendationPriority.HIGH,
					implementationEffort: 'high',
					i18nParams: { errorRate },
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
		].filter((s): s is string => VALIDATORS.string(s));

		const status =
			perf.errorRate > SYSTEM_HEALTH_THRESHOLDS.ERROR_RATE_ATTENTION_PERCENT ||
			perf.memoryUsage > SYSTEM_HEALTH_THRESHOLDS.MEMORY_USAGE_ATTENTION_PERCENT ||
			sec.authentication.failedLogins > SYSTEM_HEALTH_THRESHOLDS.FAILED_LOGINS_ATTENTION_COUNT
				? SystemInsightStatus.ATTENTION
				: SystemInsightStatus.OPTIMAL;

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
