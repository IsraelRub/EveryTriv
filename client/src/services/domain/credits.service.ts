import { API_ENDPOINTS, GameMode, QUERY_PARAMS, VALIDATION_COUNT } from '@shared/constants';
import type { CanPlayResponse, CreditBalance, CreditPurchaseOption, CreditTransaction } from '@shared/types';
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

	async canPlay(questionsPerRequest: number, gameMode?: GameMode): Promise<CanPlayResponse> {
		// Validate questions per request based on game mode (if provided)
		// If gameMode is not provided, use default validation (1-10)
		const normalizedGameMode = gameMode ? (this.resolveGameMode(gameMode) ?? gameMode) : undefined;

		if (normalizedGameMode === GameMode.TIME_LIMITED) {
			// For TIME_LIMITED mode, validate time in seconds (30-300)
			const { MIN, MAX } = VALIDATION_COUNT.TIME_LIMIT;
			if (questionsPerRequest < MIN || questionsPerRequest > MAX) {
				throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(MIN, MAX));
			}
		} else {
			// For other modes or when gameMode is not provided, validate as questions (1-10 or -1 for unlimited)
			const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
			if (questionsPerRequest !== UNLIMITED && (questionsPerRequest < MIN || questionsPerRequest > MAX)) {
				throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(MIN, MAX));
			}
		}

		try {
			const searchParams = new URLSearchParams();
			searchParams.append('questionsPerRequest', String(questionsPerRequest));
			if (normalizedGameMode) {
				searchParams.append('gameMode', normalizedGameMode);
			}
			const query = `?${searchParams.toString()}`;

			const response = await apiService.get<CanPlayResponse>(`${API_ENDPOINTS.CREDITS.CAN_PLAY}${query}`);
			const result = response.data;

			return {
				canPlay: result.canPlay,
				reason: result.reason,
			};
		} catch (error) {
			logger.userError('Failed to check if user can play', {
				errorInfo: { message: getErrorMessage(error) },
				questionsPerRequest,
				gameMode: normalizedGameMode,
			});
			throw error;
		}
	}

	async deductCredits(questionsPerRequest: number, gameMode: GameMode): Promise<CreditBalance> {
		// Validate questions per request based on game mode
		const normalizedGameMode = this.resolveGameMode(gameMode) ?? gameMode;

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

	private resolveGameMode(gameMode: GameMode): GameMode | undefined {
		return normalizeGameMode(gameMode);
	}

	async getCreditHistory(limit?: number): Promise<CreditTransaction[]> {
		try {
			logger.userInfo('Fetching credit history', { limit });
			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append(QUERY_PARAMS.LIMIT, String(limit));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<CreditTransaction[]>(`${API_ENDPOINTS.CREDITS.HISTORY}${query}`);
			const result = response.data;
			logger.userInfo('Credit history fetched successfully', { transactionsCount: result.length });
			return result;
		} catch (error) {
			logger.userError('Failed to get credit history', {
				errorInfo: { message: getErrorMessage(error) },
				limit,
			});
			throw error;
		}
	}
}

export const creditsService = new CreditsService();
