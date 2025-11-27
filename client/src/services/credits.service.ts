/**
 * Credits service for EveryTriv client
 * Handles credits balance, purchases, and credit-related operations
 *
 * @module ClientCreditsService
 * @description Client-side credits management and balance tracking
 * @used_by client/src/components/payment, client/src/views/user, client/src/hooks
 */
import { GameMode, PaymentMethod, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { CanPlayResponse, CreditBalance, CreditPurchaseOption, CreditTransaction } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import type { CreditsPurchaseRequest, CreditsPurchaseResponse } from '../types';
import { formatTimeUntilReset } from '../utils';
import { apiService } from './api.service';

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

			const balance = await apiService.getCreditBalance();

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

			const packages = await apiService.getCreditPackages();

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
	 * @param requestedQuestions Number of questions requested
	 * @returns Can play response with reason
	 */
	async canPlay(requestedQuestions: number): Promise<CanPlayResponse> {
		try {
			logger.userInfo('Checking if user can play', { requestedQuestions });

			const result = await apiService.canPlay(requestedQuestions);

			logger.userInfo('Can play check completed', {
				canPlay: result.canPlay,
				reason: result.reason,
			});
			return {
				canPlay: result.canPlay,
				reason: result.reason,
			};
		} catch (error) {
			logger.userError('Failed to check if user can play', { error: getErrorMessage(error), requestedQuestions });
			throw error;
		}
	}

	/**
	 * Deduct credits for playing
	 * @param requestedQuestions Number of questions requested
	 * @param gameMode Game mode for credit calculation
	 * @returns Updated credit balance
	 */
	async deductCredits(requestedQuestions: number, gameMode: GameMode): Promise<CreditBalance> {
		try {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userInfo('Deducting credits', { requestedQuestions, gameMode: normalizedGameMode });

			const newBalance = await apiService.deductCredits(requestedQuestions, gameMode);

			logger.userInfo('Credits deducted successfully', {
				newTotalCredits: newBalance.totalCredits,
				newPurchasedCredits: newBalance.purchasedCredits,
			});
			return newBalance;
		} catch (error) {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userError('Failed to deduct credits', {
				error: getErrorMessage(error),
				requestedQuestions,
				gameMode: normalizedGameMode,
			});
			throw error;
		}
	}

	private resolveGameMode(gameMode: GameMode): GameMode | undefined {
		return VALID_GAME_MODES.find(mode => mode === gameMode);
	}

	/**
	 * Get credit transaction history
	 * @param limit Maximum number of transactions to return (default: 20)
	 * @returns List of credit transactions
	 */
	async getCreditHistory(limit: number = 20): Promise<CreditTransaction[]> {
		try {
			logger.userInfo('Getting credit history', { limit });

			const history = await apiService.getCreditHistory(limit);

			logger.userInfo('Credit history retrieved successfully', {
				count: history.length,
			});
			return history;
		} catch (error) {
			logger.userError('Failed to get credit history', { error: getErrorMessage(error), limit });
			throw error;
		}
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

			const result = await apiService.purchaseCredits(request);

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

			const newBalance = await apiService.confirmCreditPurchase(paymentIntentId);

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
	 * Get transaction history (alias for getCreditHistory)
	 * @param limit Maximum number of transactions to return (default: 20)
	 * @returns List of credit transactions
	 */
	async getTransactionHistory(limit: number = 20): Promise<CreditTransaction[]> {
		return this.getCreditHistory(limit);
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
