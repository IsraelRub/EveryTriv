import { Controller, Get } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { UserRole, CACHE_DURATION } from '@shared/constants';

import { Cache, Public, Roles } from '../../../../../common';
import { AiProvidersService } from './providers.service';

/**
 * Controller for AI providers management
 * Handles provider statistics and health checks
 */
@Controller('api/ai-providers')
export class AiProvidersController {
	constructor(private readonly aiProvidersService: AiProvidersService) {}

	/**
	 * Get AI providers statistics
	 * @returns Promise<ProviderStats> Provider statistics
	 */
	@Get('stats')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getProviderStats() {
		try {
			const stats = this.aiProvidersService.getProviderStats();

			logger.providerStats('ai_providers', {
				totalProviders: stats.totalProviders,
				activeProviders: Object.keys(stats.providerDetails).length,
			});

			return {
				...stats,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Failed to get provider statistics', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get available providers count
	 * @returns Promise<number> Number of available providers
	 */
	@Get('count')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getAvailableProvidersCount() {
		try {
			const count = this.aiProvidersService.getAvailableProvidersCount();

			logger.providerStats('ai_providers', {
				availableProviders: count,
			});

			return {
				availableProviders: count,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Failed to get providers count', {
				error: getErrorMessage(error),
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
	@Cache(CACHE_DURATION.VERY_SHORT) // Cache for 30 seconds
	async getHealthStatus() {
		try {
			const count = this.aiProvidersService.getAvailableProvidersCount();
			const stats = this.aiProvidersService.getProviderStats();
			const status = count > 0 ? 'healthy' : 'unhealthy';

			logger.providerStats('ai_providers_health', {
				status,
				availableProviders: count,
				totalProviders: stats.totalProviders,
			});

			return {
				status,
				availableProviders: count,
				totalProviders: stats.totalProviders,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.providerError('ai_providers', 'Health check failed', {
				error: getErrorMessage(error),
			});

			return {
				status: 'error',
				error: getErrorMessage(error),
				timestamp: new Date().toISOString(),
			};
		}
	}
}
