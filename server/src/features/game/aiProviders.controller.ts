/**
 * AI Providers Controller
 *
 * @module AiProvidersController
 * @description Controller for AI provider statistics and health endpoints
 * @used_by server/app
 */
import { Controller, Get } from '@nestjs/common';

import { API_ROUTES, ProviderHealthStatus } from '@shared/constants';
import type { AiProviderHealth, AiProviderStats } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { TriviaGenerationService } from './logic/triviaGeneration.service';

@Controller(API_ROUTES.AI_PROVIDERS.BASE)
export class AiProvidersController {
	constructor(private readonly triviaGenerationService: TriviaGenerationService) {}

	/**
	 * Get AI provider statistics
	 * @returns AI provider statistics
	 */
	@Get('stats')
	async getStats(): Promise<AiProviderStats> {
		try {
			const stats = this.triviaGenerationService.getProviderStats();

			logger.apiRead('ai_providers_stats', {
				totalProviders: stats.totalProviders,
			});

			return stats;
		} catch (error) {
			logger.apiError('Failed to get AI provider stats', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get AI provider health status
	 * @returns AI provider health status
	 */
	@Get('health')
	async getHealth(): Promise<AiProviderHealth> {
		try {
			const health = this.triviaGenerationService.getProviderHealth();

			logger.apiRead('ai_providers_health', {
				status: health.status,
				availableProviders: health.availableProviders,
			});

			return health;
		} catch (error) {
			logger.apiError('Failed to get AI provider health', {
				error: getErrorMessage(error),
			});

			const health: AiProviderHealth = {
				status: ProviderHealthStatus.UNHEALTHY,
				availableProviders: 0,
				totalProviders: 1,
				timestamp: new Date().toISOString(),
				error: getErrorMessage(error),
			};

			return health;
		}
	}
}
