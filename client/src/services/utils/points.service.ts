/**
 * Points service for EveryTriv client
 * Handles points balance, purchases, and point-related operations
 *
 * @module ClientPointsService
 * @description Client-side points management and balance tracking
 * @used_by client/src/components/payment, client/src/views/user, client/src/hooks
 */
import { PointPurchaseOption } from '@shared';
import { formatTimeUntilReset } from '@shared';
import { clientLogger as logger } from '@shared';

import { PointBalance, PointTransaction } from '../../types';
import { apiService } from '../api';

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

      const balance = (await apiService.getPointBalance()) as PointBalance;

      logger.userInfo('Point balance retrieved successfully', {
        totalPoints: balance.total_points,
        purchasedPoints: balance.purchased_points,
      });
      return balance;
    } catch (error) {
      logger.userError('Failed to get point balance', { error });
      throw error;
    }
  }

  /**
   * Get available point packages
   */
  async getPointPackages(): Promise<PointPurchaseOption[]> {
    try {
      logger.userInfo('Getting point packages');

      const packages = (await apiService.getPointPackages()) as PointPurchaseOption[];

      logger.userInfo('Point packages retrieved successfully', {
        count: packages.length,
      });
      return packages;
    } catch (error) {
      logger.userError('Failed to get point packages', { error });
      throw error;
    }
  }

  /**
   * Check if user can play with current points
   */
  async canPlay(questionCount: number): Promise<{ canPlay: boolean; reason?: string }> {
    try {
      logger.userInfo('Checking if user can play', { questionCount });

      const result = await apiService.canPlay(questionCount);

      logger.userInfo('Can play check completed', {
        canPlay: result.allowed,
        reason: result.reason,
      });
      return {
        canPlay: result.allowed,
        reason: result.reason,
      };
    } catch (error) {
      logger.userError('Failed to check if user can play', { error, questionCount });
      throw error;
    }
  }

  /**
   * Deduct points for playing
   */
  async deductPoints(questionCount: number, gameMode: string): Promise<PointBalance> {
    try {
      logger.userInfo('Deducting points', { questionCount, gameMode });

      const newBalance = await apiService.deductPoints(questionCount, gameMode);

      logger.userInfo('Points deducted successfully', {
        newTotalPoints: newBalance.total_points,
        newPurchasedPoints: newBalance.purchased_points,
      });
      return newBalance;
    } catch (error) {
      logger.userError('Failed to deduct points', { error, questionCount, gameMode });
      throw error;
    }
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
      logger.userError('Failed to get point history', { error, limit });
      throw error;
    }
  }

  /**
   * Purchase points package
   */
  async purchasePoints(packageId: string): Promise<{ success: boolean; paymentUrl?: string }> {
    try {
      logger.userInfo('Purchasing points package', { packageId });

      const result = await apiService.purchasePoints(packageId);

      logger.userInfo('Points purchase initiated', { packageId, success: result.success });
      return {
        success: result.success,
        paymentUrl: result.url,
      };
    } catch (error) {
      logger.userError('Failed to purchase points', { error, packageId });
      throw error;
    }
  }

  /**
   * Confirm point purchase after payment
   */
  async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
    try {
      logger.userInfo('Confirming point purchase', { paymentIntentId });

      const newBalance = await apiService.confirmPointPurchase(paymentIntentId);

      logger.userInfo('Point purchase confirmed successfully', {
        newCredits: newBalance.total_points,
      });
      return newBalance;
    } catch (error) {
      logger.userError('Failed to confirm point purchase', { error, paymentIntentId });
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
    return formatTimeUntilReset(resetTime);
  }
}

export const pointsService = new ClientPointsService();
