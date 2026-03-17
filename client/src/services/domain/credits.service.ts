import { API_ENDPOINTS, GameMode, VALIDATION_COUNT } from '@shared/constants';
import type { CreditBalance, CreditPurchaseOption } from '@shared/types';
import { getErrorMessage, normalizeGameMode } from '@shared/utils';

import { VALIDATION_MESSAGES } from '@/constants';
import { apiService, clientLogger as logger } from '@/services';

class CreditsService {
	async getCreditBalance(): Promise<CreditBalance> {
		try {
			const response = await apiService.get<CreditBalance>(API_ENDPOINTS.CREDITS.BALANCE);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get credit balance', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getCreditPackages(): Promise<CreditPurchaseOption[]> {
		try {
			const response = await apiService.get<CreditPurchaseOption[]>(API_ENDPOINTS.CREDITS.PACKAGES);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get credit packages', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async deductCredits(questionsPerRequest: number, gameMode: GameMode): Promise<CreditBalance> {
		// Validate questions per request based on game mode
		const normalizedGameMode = normalizeGameMode(gameMode) ?? gameMode;

		if (normalizedGameMode === GameMode.TIME_LIMITED) {
			// For TIME_LIMITED mode, validate time in seconds (30-300)
			const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
			if (questionsPerRequest < MIN || questionsPerRequest > MAX) {
				throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(MIN, MAX));
			}
		} else {
			// For other modes, validate as questions (1-10 or -1 for unlimited)
			const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
			if (questionsPerRequest !== UNLIMITED && (questionsPerRequest < MIN || questionsPerRequest > MAX)) {
				throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(MIN, MAX));
			}
		}

		try {
			const response = await apiService.post<CreditBalance>(API_ENDPOINTS.CREDITS.DEDUCT, {
				questionsPerRequest,
				gameMode: normalizedGameMode,
			});
			return response.data;
		} catch (error) {
			logger.userError('Failed to deduct credits', {
				errorInfo: { message: getErrorMessage(error) },
				questionsPerRequest,
				gameMode: normalizedGameMode,
			});
			throw error;
		}
	}
}

export const creditsService = new CreditsService();
