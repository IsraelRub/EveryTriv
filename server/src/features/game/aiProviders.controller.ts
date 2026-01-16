import { Controller, Get } from '@nestjs/common';

import { API_ENDPOINTS, ProviderHealthStatus } from '@shared/constants';
import type { AiProviderHealth, AiProviderStats } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { TriviaGenerationService } from './triviaGeneration/triviaGeneration.service';

@Controller(API_ENDPOINTS.AI_PROVIDERS.BASE)
export class AiProvidersController {
	constructor(private readonly triviaGenerationService: TriviaGenerationService) {}

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
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

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
				errorInfo: { message: getErrorMessage(error) },
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
