import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ensureErrorObject } from '@shared/utils';

import { HealthStatus } from '@internal/constants';
import type { HealthCheck, HealthCheckResponse, LivenessCheckResponse, ReadinessCheckResponse } from '@internal/types';
import { SystemAnalyticsService } from '@features/analytics/services';

import { Public } from '../../common';
import { serverLogger as logger } from '../services';

@Controller('/api/health')
export class HealthController {
	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
		private readonly systemAnalyticsService: SystemAnalyticsService
	) {}

	@Get()
	@Public()
	async getHealth(): Promise<HealthCheckResponse> {
		const checks: HealthCheckResponse['checks'] = {
			database: await this.checkDatabase(),
			system: await this.checkSystem(),
		};

		const allHealthy = Object.values(checks).every(check => check.status === HealthStatus.HEALTHY);
		const anyUnhealthy = Object.values(checks).some(check => check.status === HealthStatus.UNHEALTHY);

		let overallStatus: HealthStatus = HealthStatus.HEALTHY;
		if (anyUnhealthy) {
			overallStatus = HealthStatus.UNHEALTHY;
		} else if (!allHealthy) {
			overallStatus = HealthStatus.DEGRADED;
		}

		return {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			checks,
		};
	}

	@Get('liveness')
	@Public()
	async getLiveness(): Promise<LivenessCheckResponse> {
		return { status: 'alive', timestamp: new Date().toISOString() };
	}

	@Get('readiness')
	@Public()
	async getReadiness(): Promise<ReadinessCheckResponse> {
		const dbCheck = await this.checkDatabase();
		return {
			status: dbCheck.status === HealthStatus.HEALTHY ? 'ready' : 'not ready',
			timestamp: new Date().toISOString(),
			database: dbCheck.status,
		};
	}

	private async checkDatabase(): Promise<HealthCheck> {
		const startTime = Date.now();
		try {
			await this.dataSource.query('SELECT 1');
			const responseTime = Date.now() - startTime;

			if (responseTime > 1000) {
				return {
					status: HealthStatus.DEGRADED,
					message: 'Database response time is high',
					responseTime,
				};
			}

			return {
				status: HealthStatus.HEALTHY,
				responseTime,
			};
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'Database health check failed',
			});
			return {
				status: HealthStatus.UNHEALTHY,
				message: 'Database connection failed',
				responseTime: Date.now() - startTime,
			};
		}
	}

	private async checkSystem(): Promise<HealthCheck> {
		try {
			const metrics = await this.systemAnalyticsService.getPerformanceMetrics();

			if (metrics.errorRate > 0.1 || metrics.memoryUsage > 90 || metrics.cpuUsage > 90) {
				return {
					status: HealthStatus.DEGRADED,
					message: `System metrics indicate issues: errorRate=${metrics.errorRate}, memory=${metrics.memoryUsage}%, cpu=${metrics.cpuUsage}%`,
				};
			}

			return {
				status: HealthStatus.HEALTHY,
			};
		} catch (error) {
			logger.systemError(ensureErrorObject(error), {
				contextMessage: 'System health check failed',
			});
			return {
				status: HealthStatus.UNHEALTHY,
				message: 'System metrics unavailable',
			};
		}
	}
}
