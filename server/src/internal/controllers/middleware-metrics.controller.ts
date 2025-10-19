/**
 * Middleware Metrics Controller
 *
 * @module MiddlewareMetricsController
 * @description Controller for accessing middleware performance metrics
 * @author EveryTriv Team
 */
import { Roles } from '@common';
import { Controller, Delete, Get, NotFoundException, Param } from '@nestjs/common';
import { MetricsService } from '@shared/services';
import { UserRole } from '@shared/constants';
import {
	AllMiddlewareMetricsResponse,
	getErrorMessage,
	MiddlewareMetricsResponse,
	serverLogger as logger,
} from '@shared/utils';

// MiddlewareMetrics type is used implicitly

/**
 * Controller for middleware metrics management
 */
@Controller('admin/middleware-metrics')
export class MiddlewareMetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	/**
	 * Get all middleware metrics
	 */
	@Get()
	@Roles(UserRole.ADMIN)
	async getAllMetrics(): Promise<AllMiddlewareMetricsResponse | MiddlewareMetricsResponse> {
		try {
			const allMetrics = this.metricsService.getMetrics();
			const middlewareMetrics = this.metricsService.getMiddlewareMetrics();

			// Create summary from middleware metrics
			if (!middlewareMetrics) {
				throw new NotFoundException('No middleware metrics available');
			}

			// Type guard to ensure we have the correct type
			if (typeof middlewareMetrics === 'object' && 'requestCount' in middlewareMetrics) {
				// Single middleware metrics
				// Return only the data - ResponseFormattingInterceptor will handle the response structure
				return middlewareMetrics;
			}

			// Multiple middleware metrics
			const middlewareNames = Object.keys(middlewareMetrics);
			const totalRequests = middlewareNames.reduce((sum, name) => {
				const metrics = middlewareMetrics[name];
				return sum + metrics.requestCount;
			}, 0);
			const averagePerformance =
				middlewareNames.length > 0
					? middlewareNames.reduce((sum, name) => {
							const metrics = middlewareMetrics[name];
							return sum + metrics.averageDuration;
						}, 0) / middlewareNames.length
					: 0;
			const slowestMiddleware =
				middlewareNames.length > 0
					? middlewareNames.reduce((slowest, current) => {
							const currentMetrics = middlewareMetrics[current];
							const slowestMetrics = middlewareMetrics[slowest];
							return currentMetrics.averageDuration > slowestMetrics.averageDuration ? current : slowest;
						})
					: 'N/A';
			const mostUsedMiddleware =
				middlewareNames.length > 0
					? middlewareNames.reduce((most, current) => {
							const currentMetrics = middlewareMetrics[current];
							const mostMetrics = middlewareMetrics[most];
							return currentMetrics.requestCount > mostMetrics.requestCount ? current : most;
						})
					: 'N/A';

			const summary = {
				totalMiddlewares: middlewareNames.length,
				totalRequests,
				averagePerformance,
				slowestMiddleware,
				mostUsedMiddleware,
			};

			logger.system('Middleware metrics accessed', {
				totalMiddlewares: summary.totalMiddlewares,
				totalRequests: summary.totalRequests,
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return {
				summary,
				metrics: middlewareMetrics,
				storageMetrics: allMetrics,
			};
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				error: getErrorMessage(error),
			});

			throw error;
		}
	}

	/**
	 * Get metrics for specific middleware
	 */
	@Get(':middlewareName')
	@Roles(UserRole.ADMIN)
	async getMiddlewareMetrics(@Param('middlewareName') middlewareName: string): Promise<MiddlewareMetricsResponse> {
		try {
			const metrics = this.metricsService.getMiddlewareMetrics(middlewareName);

			if (!metrics) {
				throw new NotFoundException(`No metrics found for middleware: ${middlewareName}`);
			}

			logger.system('Middleware metrics accessed', {
				middleware: middlewareName,
				requestCount: metrics.requestCount,
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return metrics;
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				middleware: middlewareName,
				error: getErrorMessage(error),
			});

			throw error;
		}
	}

	/**
	 * Reset metrics for specific middleware
	 */
	@Delete(':middlewareName')
	@Roles(UserRole.ADMIN)
	async resetMiddlewareMetrics(@Param('middlewareName') middlewareName: string) {
		try {
			this.metricsService.resetMiddlewareMetrics(middlewareName);

			logger.system('Middleware metrics reset', {
				middleware: middlewareName,
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return {
				message: `Metrics reset for middleware: ${middlewareName}`,
			};
		} catch (error) {
			logger.systemError('Failed to reset middleware metrics', {
				middleware: middlewareName,
				error: getErrorMessage(error),
			});

			throw error;
		}
	}

	/**
	 * Reset all middleware metrics
	 */
	@Delete()
	@Roles(UserRole.ADMIN)
	async resetAllMetrics() {
		try {
			this.metricsService.resetMiddlewareMetrics();

			logger.system('All middleware metrics reset', {});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return { reset: true };
		} catch (error) {
			logger.systemError('Failed to reset all middleware metrics', {
				error: getErrorMessage(error),
			});

			throw error;
		}
	}
}
