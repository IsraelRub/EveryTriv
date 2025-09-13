/**
 * Middleware Metrics Controller
 *
 * @module MiddlewareMetricsController
 * @description Controller for accessing middleware performance metrics
 * @author EveryTriv Team
 */
import { Roles } from '@common';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { MetricsService , serverLogger as logger } from '@shared';

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
	@Roles('admin', 'super-admin')
	async getAllMetrics(): Promise<any> {
		try {
			const allMetrics = this.metricsService.getMetrics();
			const middlewareMetrics = this.metricsService.getMiddlewareMetrics();

			// Create summary from middleware metrics
			if (!middlewareMetrics) {
				return {
					success: false,
					message: 'No middleware metrics available',
					timestamp: new Date().toISOString(),
				};
			}

			// Type guard to ensure we have the correct type
			if (typeof middlewareMetrics === 'object' && 'requestCount' in middlewareMetrics) {
				// Single middleware metrics
				return {
					success: true,
					data: middlewareMetrics,
					timestamp: new Date().toISOString(),
				};
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

			return {
				success: true,
				data: {
					summary,
					metrics: middlewareMetrics,
					storageMetrics: allMetrics,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				message: 'Failed to retrieve middleware metrics',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Get metrics for specific middleware
	 */
	@Get(':middlewareName')
	@Roles('admin', 'super-admin')
	async getMiddlewareMetrics(@Param('middlewareName') middlewareName: string): Promise<any> {
		try {
			const metrics = this.metricsService.getMiddlewareMetrics(middlewareName);

			if (!metrics) {
				return {
					success: false,
					message: `No metrics found for middleware: ${middlewareName}`,
					timestamp: new Date().toISOString(),
				};
			}

			logger.system('Middleware metrics accessed', {
				middleware: middlewareName,
				requestCount: metrics.requestCount,
			});

			return {
				success: true,
				data: metrics,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.systemError('Failed to get middleware metrics', {
				middleware: middlewareName,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				message: `Failed to retrieve metrics for middleware: ${middlewareName}`,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Reset metrics for specific middleware
	 */
	@Delete(':middlewareName')
	@Roles('super-admin')
	async resetMiddlewareMetrics(@Param('middlewareName') middlewareName: string) {
		try {
			this.metricsService.resetMiddlewareMetrics(middlewareName);

			logger.system('Middleware metrics reset', {
				middleware: middlewareName,
			});

			return {
				success: true,
				message: `Metrics reset for middleware: ${middlewareName}`,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.systemError('Failed to reset middleware metrics', {
				middleware: middlewareName,
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				message: `Failed to reset metrics for middleware: ${middlewareName}`,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}

	/**
	 * Reset all middleware metrics
	 */
	@Delete()
	@Roles('super-admin')
	async resetAllMetrics() {
		try {
			this.metricsService.resetMiddlewareMetrics();

			logger.system('All middleware metrics reset', {});

			return {
				success: true,
				message: 'All middleware metrics have been reset',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.systemError('Failed to reset all middleware metrics', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				success: false,
				message: 'Failed to reset all middleware metrics',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}
}
