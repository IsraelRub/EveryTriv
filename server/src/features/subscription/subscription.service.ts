import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { serverLogger as logger } from '@shared/services';
import type { SubscriptionData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { UserEntity } from 'src/internal/entities';
import { Repository } from 'typeorm';

import { PaymentService } from '../payment';

/**
 * Service for managing user subscriptions
 * Handles subscription creation, management, and billing
 */
@Injectable()
export class SubscriptionService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly paymentService: PaymentService
	) {}

	/**
	 * Get current subscription for user
	 * @param userId User ID
	 * @returns Current subscription info
	 */
	async getCurrentSubscription(userId: string) {
		try {
			logger.payment('Getting current subscription', {
				userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const defaultSubscription = this.getDefaultSubscription();

			return {
				userId: user.id,
				subscriptionId: user.currentSubscriptionId || defaultSubscription.subscriptionId,
				plan: defaultSubscription.plan,
				status: defaultSubscription.status,
				startDate: defaultSubscription.startDate,
				endDate: defaultSubscription.endDate,
				price: defaultSubscription.price,
				billingCycle: defaultSubscription.billingCycle,
				features: defaultSubscription.features,
			};
		} catch (error) {
			logger.paymentFailed('subscription-get', 'Failed to get current subscription', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Create subscription for user
	 * @param userId User ID
	 * @param plan Plan type
	 * @param billingCycle Billing cycle
	 * @returns Created subscription
	 */
	async createSubscription(userId: string, plan: string, billingCycle: string = 'monthly') {
		try {
			logger.payment('Creating subscription', {
				userId,
				planId: plan,
				paymentMethodId: billingCycle,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const startDate = new Date();
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

			const planDetails = this.getPlanDetails(plan);
			const subscriptionData = {
				subscriptionId,
				plan,
				status: 'active',
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				price: planDetails.price,
				billingCycle,
				features: planDetails.features,
			};

			const paymentResult = await this.paymentService.processPayment(userId, {
				amount: planDetails.price,
				currency: 'USD',
				description: `Subscription to ${plan} plan`,
				planType: plan as 'basic' | 'premium' | 'pro',
				numberOfPayments: billingCycle === 'yearly' ? 12 : 1,
				metadata: {
					subscriptionId,
					plan,
					billingCycle,
					price: planDetails.price,
				},
			});

			await this.userRepository.update(userId, {
				currentSubscriptionId: subscriptionId,
			});

			logger.payment('Subscription created successfully', {
				userId,
				subscriptionId: subscriptionId,
				planId: plan,
			});

			return {
				...subscriptionData,
				paymentId: paymentResult.paymentId,
			};
		} catch (error) {
			logger.paymentFailed('subscription-create', 'Failed to create subscription', {
				error: getErrorMessage(error),
				userId,
				planId: plan,
			});
			throw error;
		}
	}

	/**
	 * Cancel subscription for user
	 * @param userId User ID
	 * @returns Cancellation result
	 */
	async cancelSubscription(userId: string) {
		try {
			logger.payment('Canceling subscription', {
				userId,
				subscriptionId: userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const defaultSubscription = this.getDefaultSubscription();
			defaultSubscription.status = 'cancelled';
			(defaultSubscription as Record<string, unknown>).cancelledAt = new Date().toISOString();

			await this.userRepository.update(userId, {
				currentSubscriptionId: undefined,
			});

			return { message: 'Subscription cancelled successfully' };
		} catch (error) {
			logger.paymentFailed('subscription-cancel', 'Failed to cancel subscription', {
				error: getErrorMessage(error),
				userId,
				subscriptionId: userId,
			});
			throw error;
		}
	}

	/**
	 * Get available subscription plans
	 * @returns Available plans from PaymentService
	 */
	async getAvailablePlans() {
		try {
			logger.payment('Getting available subscription plans', {
				userId: 'all',
			});

			// Use PaymentService to get plans (single source of truth)
			return await this.paymentService.getPricingPlans();
		} catch (error) {
			logger.paymentFailed('plans-get', 'Failed to get available plans', {
				error: getErrorMessage(error),
				userId: 'all',
			});
			throw error;
		}
	}

	/**
	 * Get default subscription data
	 * @returns Default subscription object
	 */
	private getDefaultSubscription(): SubscriptionData {
		return {
			subscriptionId: null,
			plan: 'free',
			status: 'active',
			startDate: new Date().toISOString(),
			endDate: null,
			price: 0,
			billingCycle: null,
			features: ['basic_questions'],
		};
	}

	/**
	 * Get plan details by plan name
	 * @param plan Plan name
	 * @returns Plan details
	 */
	private getPlanDetails(plan: string) {
		const plans = {
			basic: {
				price: 9.99,
				features: ['basic_questions', 'ad_free'],
			},
			premium: {
				price: 19.99,
				features: ['basic_questions', 'ad_free', 'priority_support', 'advanced_analytics'],
			},
			pro: {
				price: 39.99,
				features: [
					'basic_questions',
					'ad_free',
					'priority_support',
					'advanced_analytics',
					'custom_difficulty',
					'api_access',
				],
			},
		};

		return plans[plan as keyof typeof plans] || plans.basic;
	}
}
