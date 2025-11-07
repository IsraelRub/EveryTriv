/**
 * Points service for EveryTriv client
 * Handles points balance, purchases, and point-related operations
 *
 * @module ClientPointsService
 * @description Client-side points management and balance tracking
 * @used_by client/src/components/payment, client/src/views/user, client/src/hooks
 */
import { GameMode, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { CanPlayResponse, PointBalance, PointPurchaseOption, PointTransaction } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { formatTimeUntilReset } from '../utils';
import { apiService } from './api.service';

/**
 * Main points management service class
 * @class ClientPointsService
 * @description Handles all points-related operations for the client
 * @used_by client/src/components/payment, client/src/views/user
 */
class ClientPointsService {
	/**
	 * Retrieve current user point balance
	 * @returns {Promise<PointBalance>} Current point balance information
	 * @throws {Error} When balance retrieval fails
	 */
	async getPointBalance(): Promise<PointBalance> {
		try {
			logger.userInfo('Getting point balance');

			const balance = await apiService.getPointBalance();

			logger.userInfo('Point balance retrieved successfully', {
				totalPoints: balance.totalPoints,
				purchasedPoints: balance.purchasedPoints,
			});
			return balance;
		} catch (error) {
			logger.userError('Failed to get point balance', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get available point packages
	 */
	async getPointPackages(): Promise<PointPurchaseOption[]> {
		try {
			logger.userInfo('Getting point packages');

			const packages = await apiService.getPointPackages();

			logger.userInfo('Point packages retrieved successfully', {
				count: packages.length,
			});
			return packages;
		} catch (error) {
			logger.userError('Failed to get point packages', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Check if user can play with current points
	 */
	async canPlay(questionCount: number): Promise<CanPlayResponse> {
		try {
			logger.userInfo('Checking if user can play', { questionCount });

			const result = await apiService.canPlay(questionCount);

			logger.userInfo('Can play check completed', {
				canPlay: result.canPlay,
				reason: result.reason,
			});
			return {
				canPlay: result.canPlay,
				reason: result.reason,
			};
		} catch (error) {
			logger.userError('Failed to check if user can play', { error: getErrorMessage(error), questionCount });
			throw error;
		}
	}

	/**
	 * Deduct points for playing
	 */
	async deductPoints(questionCount: number, gameMode: GameMode): Promise<PointBalance> {
		try {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userInfo('Deducting points', { questionCount, gameMode: normalizedGameMode });

			const newBalance = await apiService.deductPoints(questionCount, gameMode);

			logger.userInfo('Points deducted successfully', {
				newTotalPoints: newBalance.totalPoints,
				newPurchasedPoints: newBalance.purchasedPoints,
			});
			return newBalance;
		} catch (error) {
			const normalizedGameMode = this.resolveGameMode(gameMode);
			logger.userError('Failed to deduct points', {
				error: getErrorMessage(error),
				questionCount,
				gameMode: normalizedGameMode,
			});
			throw error;
		}
	}

	private resolveGameMode(gameMode: GameMode): GameMode | undefined {
		return VALID_GAME_MODES.find(mode => mode === gameMode);
	}

	/**
	 * Get point transaction history
	 */
	async getPointHistory(limit: number = 20): Promise<PointTransaction[]> {
		try {
			logger.userInfo('Getting point history', { limit });

			const history = await apiService.getPointHistory(limit);

			logger.userInfo('Point history retrieved successfully', {
				count: history.length,
			});
			return history;
		} catch (error) {
			logger.userError('Failed to get point history', { error: getErrorMessage(error), limit });
			throw error;
		}
	}

	/**
	 * Purchase points package
	 */
	async purchasePoints(packageId: string): Promise<{ success: boolean; paymentUrl?: string }> {
		try {
			logger.userInfo('Purchasing points package', { id: packageId });

			const result = await apiService.purchasePoints(packageId);

			logger.userInfo('Points purchase initiated', { id: packageId, success: result.success });
			return {
				success: result.success,
				paymentUrl: result.url,
			};
		} catch (error) {
			logger.userError('Failed to purchase points', { error: getErrorMessage(error), id: packageId });
			throw error;
		}
	}

	/**
	 * Confirm point purchase after payment
	 */
	async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
		try {
			logger.userInfo('Confirming point purchase', { id: paymentIntentId });

			const newBalance = await apiService.confirmPointPurchase(paymentIntentId);

			logger.userInfo('Point purchase confirmed successfully', {
				newCredits: newBalance.totalPoints,
			});
			return newBalance;
		} catch (error) {
			logger.userError('Failed to confirm point purchase', { error: getErrorMessage(error), id: paymentIntentId });
			throw error;
		}
	}

	/**
	 * Get transaction history (alias for getPointHistory)
	 */
	async getTransactionHistory(limit: number = 20): Promise<PointTransaction[]> {
		return this.getPointHistory(limit);
	}

	/**
	 * Format time until reset for display
	 */
	formatTimeUntilReset(resetTime: Date): string {
		return formatTimeUntilReset(resetTime.getTime());
	}
}

export const pointsService = new ClientPointsService();
