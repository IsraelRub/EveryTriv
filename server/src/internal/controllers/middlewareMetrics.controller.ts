import { Controller, Delete, Get, NotFoundException, Param } from '@nestjs/common';

import { ERROR_CODES, UserRole, VALIDATORS } from '@shared/constants';
import type { AllMetricsResponse, MetricsResponse } from '@shared/types';
import { getErrorMessage, isRecord } from '@shared/utils';

import { serverLogger as logger, MetricsService } from '@internal/services';
import { Roles } from '@common';

function isMiddlewareMetrics(metrics: unknown): metrics is { requestCount: number } {
	return isRecord(metrics) && VALIDATORS.number(metrics.requestCount);
}

// MiddlewareMetrics type is used implicitly

@Controller('admin/middleware-metrics')
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get()
	@Roles(UserRole.ADMIN)
	async getAllMetrics(): Promise<AllMetricsResponse | MetricsResponse> {
		try {
			const allMetrics = this.metricsService.getMetrics();
			const middlewareMetrics = this.metricsService.getMiddlewareMetrics();

			// Create summary from middleware metrics
			if (!middlewareMetrics) {
				throw new NotFoundException(ERROR_CODES.NO_MIDDLEWARE_METRICS);
			}

			// Type guard to ensure we have the correct type
			if (isMiddlewareMetrics(middlewareMetrics)) {
				// Single middleware metrics
				// Return only the data - ResponseFormatter will handle the response structure
				return middlewareMetrics;
			}

			// Multiple middleware metrics
			const middlewareNames = Object.keys(middlewareMetrics);
			const totalRequests = middlewareNames.reduce((sum, name) => {
				const metrics = middlewareMetrics[name];
				return sum + (metrics?.requestCount ?? 0);
			}, 0);
			const averagePerformance =
				middlewareNames.length > 0
					? middlewareNames.reduce((sum, name) => {
							const metrics = middlewareMetrics[name];
							return sum + (metrics?.averageDuration ?? 0);
						}, 0) / middlewareNames.length
					: 0;
			let slowestMiddleware = 'N/A';
			if (middlewareNames.length > 0) {
				let maxDuration = 0;
				for (const name of middlewareNames) {
					const metrics = middlewareMetrics[name];
					if (metrics != null && metrics.averageDuration > maxDuration) {
						maxDuration = metrics.averageDuration;
						slowestMiddleware = name;
					}
				}
			}
			let mostUsedMiddleware = 'N/A';
			if (middlewareNames.length > 0) {
				let maxRequests = 0;
				for (const name of middlewareNames) {
					const metrics = middlewareMetrics[name];
					if (metrics != null && metrics.requestCount > maxRequests) {
						maxRequests = metrics.requestCount;
						mostUsedMiddleware = name;
					}
				}
			}

			const summary = {
				totalMiddlewares: middlewareNames.length,
				totalRequests,
				averagePerformance,
				slowestMiddleware,
				mostUsedMiddleware,
			};

			logger.systemInfo('Middleware metrics accessed', {
				totalMiddlewares: summary.totalMiddlewares,
				requestCounts: { total: summary.totalRequests },
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return {
				summary,
				metrics: middlewareMetrics,
				storageMetrics: allMetrics,
			};
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});

			throw error;
		}
	}

	@Get(':middlewareName')
	@Roles(UserRole.ADMIN)
	async getMiddlewareMetrics(@Param('middlewareName') middlewareName: string): Promise<MetricsResponse> {
		try {
			const metrics = this.metricsService.getMiddlewareMetrics(middlewareName);

			if (!metrics) {
				throw new NotFoundException(`${ERROR_CODES.NO_METRICS_FOUND}: ${middlewareName}`);
			}

			const requestCount = isMiddlewareMetrics(metrics) ? metrics.requestCount : 0;

			logger.systemInfo('Middleware metrics accessed', {
				middleware: middlewareName,
				requestCounts: { current: requestCount },
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return metrics;
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				middleware: middlewareName,
				errorInfo: { message: getErrorMessage(error) },
			});

			throw error;
		}
	}

	@Delete(':middlewareName')
	@Roles(UserRole.ADMIN)
	async resetMiddlewareMetrics(@Param('middlewareName') middlewareName: string) {
		try {
			this.metricsService.resetMiddlewareMetrics(middlewareName);

			logger.systemInfo('Middleware metrics reset', {
				middleware: middlewareName,
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return {
				message: `Metrics reset for middleware: ${middlewareName}`,
			};
		} catch (error) {
			logger.systemError('Failed to reset middleware metrics', {
				middleware: middlewareName,
				errorInfo: { message: getErrorMessage(error) },
			});

			throw error;
		}
	}

	@Delete()
	@Roles(UserRole.ADMIN)
	async resetAllMetrics() {
		try {
			this.metricsService.resetMiddlewareMetrics();

			logger.systemInfo('All middleware metrics reset', {});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return { reset: true };
		} catch (error) {
			logger.systemError('Failed to reset all middleware metrics', {
				errorInfo: { message: getErrorMessage(error) },
			});

			throw error;
		}
	}
}
