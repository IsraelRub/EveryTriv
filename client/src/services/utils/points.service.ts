/**
 * Points service for EveryTriv client
 * Handles points balance, purchases, and point-related operations
 *
 * @module ClientPointsService
 * @description Client-side points management and balance tracking
 * @used_by client/components/payment, client/views/user, client/hooks
 */
import { PointPurchaseOption, UrlResponse } from 'everytriv-shared/types';
import { formatTimeUntilReset } from 'everytriv-shared/utils';

import { PointBalance, PointTransaction } from '../../types';
import { apiService } from '../api';
import { loggerService } from './logger.service';

/**
 * Main points management service class
 * @class ClientPointsService
 * @description Handles all points-related operations for the client
 * @used_by client/components/payment, client/views/user
 */
class ClientPointsService {
	/**
	 * Retrieve current user point balance
	 * @returns {Promise<PointBalance>} Current point balance information
	 * @throws {Error} When balance retrieval fails
	 */
	async getPointBalance(): Promise<PointBalance> {
		try {
			loggerService.userInfo('Getting point balance');

			const balance = (await apiService.getPointBalance()) as PointBalance;

			loggerService.userInfo('Point balance retrieved successfully', {
				totalPoints: balance.total_points,
				purchasedPoints: balance.purchased_points,
			});
			return balance;
		} catch (error) {
			loggerService.userError('Failed to get point balance', { error });
			throw error;
		}
	}

	/**
	 * Get available point packages
	 */
	async getPointPackages(): Promise<PointPurchaseOption[]> {
		try {
			loggerService.userInfo('Getting point packages');

			const packages = (await apiService.getPointPackages()) as PointPurchaseOption[];

			loggerService.userInfo('Point packages retrieved successfully', {
				count: packages.length,
			});
			return packages;
		} catch (error) {
			loggerService.userError('Failed to get point packages', { error });
			throw error;
		}
	}

	/**
	 * Check if user can play with current points
	 */
	async canPlay(questionCount: number): Promise<{ canPlay: boolean; reason?: string }> {
		try {
			loggerService.userInfo('Checking if user can play', { questionCount });

			const result = await apiService.canPlay(questionCount);

			loggerService.userInfo('Can play check completed', {
				canPlay: result.allowed,
				reason: result.reason,
			});
			return {
				canPlay: result.allowed,
				reason: result.reason,
			};
		} catch (error) {
			loggerService.userError('Failed to check if user can play', { error, questionCount });
			throw error;
		}
	}

	/**
	 * Deduct points for playing
	 */
	async deductPoints(questionCount: number, gameMode: string): Promise<PointBalance> {
		try {
			loggerService.userInfo('Deducting points', { questionCount, gameMode });

			const newBalance = await apiService.deductPoints(questionCount, gameMode);

			loggerService.userInfo('Points deducted successfully', {
				newTotalPoints: newBalance.total_points,
				newPurchasedPoints: newBalance.purchased_points,
			});
			return newBalance;
		} catch (error) {
			loggerService.userError('Failed to deduct points', { error, questionCount, gameMode });
			throw error;
		}
	}

	/**
	 * Get point transaction history
	 */
	async getPointHistory(limit: number = 20): Promise<PointTransaction[]> {
		try {
			loggerService.userInfo('Getting point history', { limit });

			const history = await apiService.getPointHistory(limit);

			loggerService.userInfo('Point history retrieved successfully', {
				count: history.length,
			});
			return history;
		} catch (error) {
			loggerService.userError('Failed to get point history', { error, limit });
			throw error;
		}
	}

	/**
	 * Purchase points package
	 */
	async purchasePoints(packageId: string): Promise<UrlResponse & { paymentUrl?: string }> {
		try {
			loggerService.userInfo('Purchasing points package', { packageId });

			const result = await apiService.purchasePointPackage(packageId);

			loggerService.userInfo('Points purchase initiated', { packageId, success: result.status === 'success' });
			return {
				success: result.status === 'success',
				paymentUrl: result.id ? `/payment/process/${result.id}` : undefined,
			};
		} catch (error) {
			loggerService.userError('Failed to purchase points', { error, packageId });
			throw error;
		}
	}

	/**
	 * Confirm point purchase after payment
	 */
	async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
		try {
			loggerService.userInfo('Confirming point purchase', { paymentIntentId });

			const newBalance = await apiService.confirmPointPurchase(paymentIntentId);

			loggerService.userInfo('Point purchase confirmed successfully', {
				newCredits: newBalance.total_points,
			});
			return newBalance;
		} catch (error) {
			loggerService.userError('Failed to confirm point purchase', { error, paymentIntentId });
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
		// Use shared utility function to avoid duplication
		return formatTimeUntilReset(resetTime);
	}
}

export const pointsService = new ClientPointsService();
