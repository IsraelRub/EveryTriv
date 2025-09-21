/**
 * Subscription service for EveryTriv client
 * Handles subscription plans, current subscription, and subscription management
 *
 * @module ClientSubscriptionService
 * @description Client-side subscription management service
 * @used_by client/src/views/payment, client/src/components/subscription
 */
import { SubscriptionData,SubscriptionPlans } from '@shared';
import { clientLogger } from '@shared';

import { apiService } from '../api';

/**
 * Main subscription service class
 * @class ClientSubscriptionService
 * @description Handles all subscription operations for the client
 * @used_by client/src/views/payment, client/src/components/subscription
 */
class ClientSubscriptionService {
  /**
   * Get available subscription plans
   * @returns Available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlans> {
    try {
      clientLogger.userInfo('Getting subscription plans');
      const plans = await apiService.getSubscriptionPlans();
      clientLogger.userInfo('Subscription plans retrieved successfully');
      return plans;
    } catch (error) {
      clientLogger.userError('Failed to get subscription plans', { error });
      throw error;
    }
  }

  /**
   * Get current user subscription
   * @returns Current subscription data
   */
  async getCurrentSubscription(): Promise<SubscriptionData> {
    try {
      clientLogger.userInfo('Getting current subscription');
      const subscription = await apiService.getCurrentSubscription();
      clientLogger.userInfo('Current subscription retrieved successfully');
      return subscription;
    } catch (error) {
      clientLogger.userError('Failed to get current subscription', { error });
      throw error;
    }
  }

  /**
   * Create new subscription
   * @param plan Plan type
   * @param billingCycle Billing cycle
   * @returns Created subscription
   */
  async createSubscription(
    plan: string,
    billingCycle: string = 'monthly'
  ): Promise<SubscriptionData> {
    try {
      clientLogger.userInfo('Creating subscription', { plan, billingCycle });
      const subscription = await apiService.createSubscription(plan, billingCycle);
      clientLogger.userInfo('Subscription created successfully', { plan, billingCycle });
      return subscription;
    } catch (error) {
      clientLogger.userError('Failed to create subscription', { error, plan, billingCycle });
      throw error;
    }
  }

  /**
   * Cancel current subscription
   * @returns Cancellation result
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      clientLogger.userInfo('Cancelling subscription');
      const result = await apiService.cancelSubscription();
      clientLogger.userInfo('Subscription cancelled successfully');
      return result;
    } catch (error) {
      clientLogger.userError('Failed to cancel subscription', { error });
      throw error;
    }
  }
}

export const subscriptionService = new ClientSubscriptionService();
