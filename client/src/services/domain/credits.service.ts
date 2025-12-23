/**
 * Credits service for EveryTriv client
 * Handles credits balance, purchases, and credit-related operations
 *
 * @module ClientCreditsService
 * @description Client-side credits management and balance tracking
 * @used_by client/src/components/payment, client/src/views/user, client/src/hooks
 */
import { API_ROUTES, GameMode, PaymentMethod, VALID_GAME_MODES } from '@shared/constants';
import type {
	CanPlayResponse,
	CreditBalance,
	CreditPurchaseOption,
	CreditsPurchaseRequest,
	CreditTransaction,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';

import type { CreditsPurchaseResponse } from '@/types';

import { formatTimeUntilReset } from '@/utils';

/**
 * Main credits management service class
 * @class ClientCreditsService
 * @description Handles all credits-related operations for the client
 * @used_by client/src/components/payment, client/src/views/user
 */
class ClientCreditsService {
	/**
	 * Retrieve current user credit balance
	 * @returns {Promise<CreditBalance>} Current credit balance information
	 * @throws {Error} When balance retrieval fails
	 */
	async getCreditBalance(): Promise<CreditBalance> {
		try {
			logger.userInfo('Getting credit balance');

			const response = await apiService.get<CreditBalance>(API_ROUTES.CREDITS.BALANCE);
			const balance = response.data;

			logger.userInfo('Credit balance retrieved successfully', {
				credits: balance.totalCredits,
				purchasedCredits: balance.purchasedCredits,
			});
			return balance;
		} catch (error) {
			logger.userError('Failed to get credit balance', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get available credit packages
	 * @returns List of available credit purchase options
	 */
	async getCreditPackages(): Promise<CreditPurchaseOption[]> {
		try {
			logger.userInfo('Getting credit packages');

			const response = await apiService.get<CreditPurchaseOption[]>(API_ROUTES.CREDITS.PACKAGES);
			const packages = response.data;

			logger.userInfo('Credit packages retrieved successfully', {
				count: packages.length,
			});
			return packages;
		} catch (error) {
			logger.userError('Failed to get credit packages', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Check if user can play with current credits
	 * @param questionsPerRequest Number of questions per request
	 * @returns Can play response with reason
	 */
	async canPlay(questionsPerRequest: number): Promise<CanPlayResponse> {
		// Validate questions per request
		if (questionsPerRequest < 1 || questionsPerRequest > 50) {
			throw new Error('Questions per request must be between 1 and 50');
		}

		try {
			logger.userInfo('Checking if user can play', { questionsPerRequest });

			const searchParams = new URLSearchParams();
			searchParams.append('questionsPerRequest', String(questionsPerRequest));
			const query = `?${searchParams.toString()}`;

			const response = await apiService.get<CanPlayResponse>(`${API_ROUTES.CREDITS.CAN_PLAY}${query}`);
			const result = response.data;

			logger.userInfo('Can play check completed', {
				canPlay: result.canPlay,
				reason: result.reason,
			});
			return {
				canPlay: result.canPlay,
				reason: result.reason,
			};
		} catch (error) {
			logger.userError('Failed to check if user can play', { error: getErrorMessage(error), questionsPerRequest });
			throw error;
		}
	}

	/**
	 * Deduct credits for playing
	 * @param questionsPerRequest Number of questions per request
	 * @param gameMode Game mode for credit calculation
	 * @returns Updated credit balance
	 */
	async deductCredits(questionsPerRequest: number, gameMode: GameMode): Promise<CreditBalance> {
		// Validate questions per request
		if (questionsPerRequest < 1 || questionsPerRequest > 50) {
			throw new Error('Questions per request must be between 1 and 50');
		}

		try {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userInfo('Deducting credits', { questionsPerRequest, gameMode: normalizedGameMode });

			const response = await apiService.post<CreditBalance>(API_ROUTES.CREDITS.DEDUCT, {
				questionsPerRequest,
				gameMode: normalizedGameMode,
			});
			const newBalance = response.data;

			logger.userInfo('Credits deducted successfully', {
				newTotalCredits: newBalance.totalCredits,
				newPurchasedCredits: newBalance.purchasedCredits,
			});
			return newBalance;
		} catch (error) {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userError('Failed to deduct credits', {
				error: getErrorMessage(error),
				questionsPerRequest,
				gameMode: normalizedGameMode,
			});
			throw error;
		}
	}

	private resolveGameMode(gameMode: GameMode): GameMode | undefined {
		return VALID_GAME_MODES.find(mode => mode === gameMode);
	}

	/**
	 * Purchase credits package
	 * @param request Credits purchase request data
	 * @returns Credits purchase response
	 */
	async purchaseCredits(request: CreditsPurchaseRequest): Promise<CreditsPurchaseResponse> {
		try {
			logger.userInfo('Purchasing credits package', {
				id: request.packageId,
				method: request.paymentMethod ?? PaymentMethod.MANUAL_CREDIT,
			});

			const response = await apiService.post<CreditsPurchaseResponse>(API_ROUTES.CREDITS.PURCHASE, request);
			const result = response.data;

			logger.userInfo('Credits purchase response received', {
				id: request.packageId,
				status: result.status,
				method: request.paymentMethod,
			});

			return result;
		} catch (error) {
			logger.userError('Failed to purchase credits', {
				error: getErrorMessage(error),
				id: request.packageId,
				method: request.paymentMethod,
			});
			throw error;
		}
	}

	/**
	 * Confirm credit purchase after payment
	 * @param paymentIntentId Payment intent identifier
	 * @returns Updated credit balance
	 */
	async confirmCreditPurchase(paymentIntentId: string): Promise<CreditBalance> {
		try {
			logger.userInfo('Confirming credit purchase', { id: paymentIntentId });

			const response = await apiService.post<CreditBalance>(API_ROUTES.CREDITS.CONFIRM_PURCHASE, { paymentIntentId });
			const newBalance = response.data;

			logger.userInfo('Credit purchase confirmed successfully', {
				newCredits: newBalance.totalCredits,
			});
			return newBalance;
		} catch (error) {
			logger.userError('Failed to confirm credit purchase', { error: getErrorMessage(error), id: paymentIntentId });
			throw error;
		}
	}

	/**
	 * Get credit transaction history
	 * @param limit Optional limit for number of transactions to fetch
	 * @returns List of credit transactions
	 */
	async getCreditHistory(limit?: number): Promise<CreditTransaction[]> {
		try {
			logger.userInfo('Getting credit history', { limit });

			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append('limit', String(limit));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<CreditTransaction[]>(`${API_ROUTES.CREDITS.HISTORY}${query}`);
			const history = response.data;

			logger.userInfo('Credit history retrieved successfully', {
				transactionsCount: history.length,
			});
			return history;
		} catch (error) {
			logger.userError('Failed to get credit history', { error: getErrorMessage(error), limit });
			throw error;
		}
	}

	/**
	 * Format time until reset for display
	 * @param resetTime Reset time date
	 * @returns Formatted time string
	 */
	formatTimeUntilReset(resetTime: Date): string {
		return formatTimeUntilReset(resetTime.getTime());
	}
}

export const creditsService = new ClientCreditsService();
