import { Controller, Get } from '@nestjs/common';
import { serverLogger as logger } from '@shared';
import { Public, Roles } from '../../../../../common';

import { AiProvidersService } from './providers.service';

/**
 * Controller for AI providers management
 * Handles provider statistics and health checks
 */
@Controller('api/ai-providers')
export class AiProvidersController {
	constructor(
		private readonly aiProvidersService: AiProvidersService
	) {}

	/**
	 * Get AI providers statistics
	 * @returns Promise<ProviderStats> Provider statistics
	 */
	@Get('stats')
	@Roles('admin', 'super-admin')
	async getProviderStats() {
		try {
			logger.providerStats('ai_providers', {});

			const stats = this.aiProvidersService.getProviderStats();

			return {
				...stats,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Failed to get provider statistics', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get available providers count
	 * @returns Promise<number> Number of available providers
	 */
	@Get('count')
	@Roles('admin', 'super-admin')
	async getAvailableProvidersCount() {
		try {
			logger.providerStats('ai_providers', {});

			const count = this.aiProvidersService.getAvailableProvidersCount();

			return {
				availableProviders: count,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Failed to get providers count', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Health check for AI providers
	 * @returns Promise<{
	 *   status: 'healthy' | 'degraded' | 'unhealthy';
	 *   providers: AIProviderInstance[];
	 *   lastCheck: Date;
	 *   averageResponseTime: number;
	 * }> - Health status
	 */
	@Get('health')
	@Public()
	async getHealthStatus() {
		try {
			const count = this.aiProvidersService.getAvailableProvidersCount();
			const stats = this.aiProvidersService.getProviderStats();

			return {
				status: count > 0 ? 'healthy' : 'unhealthy',
				availableProviders: count,
				totalProviders: stats.totalProviders,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Health check failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			return {
				status: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}
}
