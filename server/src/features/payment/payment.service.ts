/**
 * Payment Service
 *
 * @module PaymentService
 * @description Service for handling payment operations and subscription management
 * @used_by server/src/features/payment/payment.controller.ts
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	CACHE_DURATION,
	PAYMENT_ERROR_MESSAGES,
	PaymentMethod,
	PaymentStatus,
	PlanType,
	POINT_PURCHASE_PACKAGES,
	SUBSCRIPTION_PLANS,
	SubscriptionStatus,
} from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type {
	PaymentData,
	PaymentResult,
	PointBalance,
	PointPurchaseOption,
	SubscriptionData,
	SubscriptionPlanDetails,
	SubscriptionPlans,
} from '@shared/types';
import { generatePaymentIntentId, getErrorMessage } from '@shared/utils';

import { PaymentHistoryEntity, SubscriptionEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules/cache';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';

@Injectable()
export class PaymentService {
	constructor(
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
		@InjectRepository(SubscriptionEntity)
		private readonly subscriptionRepository: Repository<SubscriptionEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService
	) {}

	/**
	 * Get available pricing plans
	 * @returns Available subscription plans
	 */
	async getPricingPlans(): Promise<SubscriptionPlans> {
		try {
			logger.payment('Getting pricing plans');

			const cachedPlans = await this.cacheService.get<SubscriptionPlans>('pricing_plans');
			if (cachedPlans.success && cachedPlans.data) {
				return cachedPlans.data;
			}

			await this.cacheService.set('pricing_plans', SUBSCRIPTION_PLANS, CACHE_DURATION.VERY_LONG);

			return SUBSCRIPTION_PLANS;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get pricing plans', {
				error: getErrorMessage(error),
			});
			throw createServerError('retrieve pricing plans', error);
		}
	}

	/**
	 * Get point purchase options
	 * @returns Available point purchase options
	 */
	async getPointPurchaseOptions(): Promise<PointPurchaseOption[]> {
		try {
			logger.payment('Getting point purchase options');

			const cachedOptions = await this.cacheService.get<PointPurchaseOption[]>('point_purchase_options');
			if (cachedOptions.success && cachedOptions.data) {
				return cachedOptions.data;
			}

			await this.cacheService.set('point_purchase_options', POINT_PURCHASE_PACKAGES, CACHE_DURATION.VERY_LONG);

			return [...POINT_PURCHASE_PACKAGES];
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get point purchase options', {
				error: getErrorMessage(error),
			});
			throw createServerError('retrieve point options', error);
		}
	}

	/**
	 * Process payment
	 * @param userId User ID
	 * @param paymentData Payment data
	 * @returns Payment result
	 */
	async processPayment(userId: string, paymentData: PaymentData): Promise<PaymentResult> {
		try {
			logger.payment('Processing payment', { userId, paymentType: paymentData.planType || 'unknown' });

			if (!paymentData.amount || paymentData.amount <= 0) {
				throw createValidationError('payment amount', 'number');
			}

			const paymentHistory = this.paymentHistoryRepository.create({
				userId: userId,
				amount: paymentData.amount,
				currency: paymentData.currency || 'USD',
				status: PaymentStatus.PENDING,
				paymentMethod: PaymentMethod.STRIPE,
				transactionId: this.generateTransactionId(),
			});

			await this.paymentHistoryRepository.save(paymentHistory);
			logger.databaseCreate('payment_history', {
				id: paymentHistory.transactionId,
				userId,
				amount: paymentData.amount,
			});

			// Simulate payment processing
			const paymentSuccess = await this.simulatePaymentProcessing();

			if (paymentSuccess) {
				// Update payment status
				paymentHistory.status = PaymentStatus.COMPLETED;
				paymentHistory.completedAt = new Date();
				await this.paymentHistoryRepository.save(paymentHistory);

				// Handle payment type specific logic
				await this.handlePaymentSuccess(userId, paymentData);

				logger.payment('Payment processed successfully', {
					userId,
					id: paymentHistory.transactionId,
					amount: paymentData.amount,
				});

				return {
					transactionId: paymentHistory.transactionId,
					status: 'completed',
					message: 'Payment processed successfully',
					amount: paymentData.amount,
					currency: paymentData.currency || 'USD',
				};
			} else {
				// Update payment status
				paymentHistory.status = PaymentStatus.FAILED;
				paymentHistory.failedAt = new Date();
				await this.paymentHistoryRepository.save(paymentHistory);

				logger.paymentFailed(paymentHistory.transactionId || 'unknown', 'Payment processing failed', {
					userId,
					id: paymentHistory.transactionId,
				});

				return {
					transactionId: paymentHistory.transactionId,
					status: 'failed',
					message: 'Payment processing failed',
					amount: paymentData.amount,
					currency: paymentData.currency || 'USD',
				};
			}
		} catch (error) {
			logger.paymentFailed('unknown', 'Payment processing error', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError('process payment', new Error(PAYMENT_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED));
		}
	}

	/**
	 * Get payment history for user
	 * @param userId User ID
	 * @param limit Number of records to return
	 * @param offset Number of records to skip
	 * @returns Payment history
	 */
	async getPaymentHistory(userId: string, limit: number = 10, offset: number = 0): Promise<PaymentHistoryEntity[]> {
		try {
			logger.payment('Getting payment history', { userId, limit, offset });

			const payments = await this.paymentHistoryRepository.find({
				where: { userId: userId },
				order: { createdAt: 'DESC' },
				take: limit,
				skip: offset,
			});

			return payments;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get payment history', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError(
				'retrieve payment history',
				new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_PAYMENT_HISTORY)
			);
		}
	}

	/**
	 * Get subscription details for user
	 * @param userId User ID
	 * @returns Subscription details
	 */
	async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
		try {
			logger.payment('Getting user subscription', { userId });

			const subscription = await this.subscriptionRepository.findOne({
				where: { userId: userId, status: SubscriptionStatus.ACTIVE },
				order: { createdAt: 'DESC' },
			});

			if (!subscription) {
				return null;
			}

			const planDetailsRaw = SUBSCRIPTION_PLANS[subscription.planType];
			const planDetails: SubscriptionPlanDetails | undefined = planDetailsRaw
				? {
						...planDetailsRaw,
						features: [...planDetailsRaw.features],
					}
				: undefined;

			return {
				id: subscription.id,
				subscriptionId: subscription.id,
				planType: subscription.planType,
				planDetails,
				status: subscription.status,
				startDate: subscription.startDate,
				endDate: subscription.endDate,
				billingCycle: null,
				price: planDetails?.price ?? 0,
				features: planDetails?.features ? [...planDetails.features] : [],
				autoRenew: subscription.autoRenew,
				nextBillingDate: subscription.nextBillingDate,
			};
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get user subscription', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError(
				'retrieve subscription',
				new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_SUBSCRIPTION)
			);
		}
	}

	/**
	 * Purchase points
	 * @param userId User ID
	 * @param optionId Point purchase option ID
	 * @returns Point balance update result
	 */
	async purchasePoints(userId: string, optionId: string): Promise<PointBalance> {
		try {
			logger.payment('Purchasing points', { userId, id: optionId });

			const options = await this.getPointPurchaseOptions();
			const selectedOption = options.find(opt => opt.id === optionId);

			if (!selectedOption) {
				throw createValidationError('point option', 'string');
			}

			// Process payment
			const paymentResult = await this.processPayment(userId, {
				amount: selectedOption.price,
				currency: selectedOption.currency || 'USD',
				description: `Points purchase: ${selectedOption.points} points`,
				metadata: {
					optionId,
					points: selectedOption.points,
					bonus: selectedOption.bonus ?? 0,
				},
			});

			if (paymentResult.status !== 'completed') {
				throw createServerError('process payment', new Error('Payment failed'));
			}

			// Update user points
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const totalPoints = selectedOption.points + (selectedOption.bonus ?? 0);
			user.points = (user.points ?? 0) + totalPoints;
			await this.userRepository.save(user);

			logger.payment('Points purchased successfully', {
				userId,
				points: totalPoints,
				id: paymentResult.transactionId,
			});

			return {
				totalPoints: user.points ?? 0,
				freeQuestions: 0, // Default value since property doesn't exist
				purchasedPoints: 0, // Default value since property doesn't exist
				dailyLimit: 10,
				canPlayFree: true, // Default value
				nextResetTime: null,
				userId,
				balance: user.points,
			};
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to purchase points', {
				userId,
				id: optionId,
				error: getErrorMessage(error),
			});
			throw createServerError('purchase points', new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_PURCHASE_POINTS));
		}
	}

	/**
	 * Subscribe to a plan
	 * @param userId User ID
	 * @param planType Plan type
	 * @param paymentData Payment data
	 * @returns Subscription result
	 */
	async subscribeToPlan(userId: string, planType: PlanType, paymentData: PaymentData): Promise<SubscriptionData> {
		try {
			logger.payment('Subscribing to plan', { userId, planType });

			// Validate plan type
			if (!SUBSCRIPTION_PLANS[planType]) {
				throw createValidationError('plan type', 'string');
			}

			// Process payment
			const paymentResult = await this.processPayment(userId, {
				...paymentData,
				type: 'subscription',
				metadata: { planType },
			});

			if (paymentResult.status !== 'completed') {
				throw createServerError('process payment', new Error('Payment failed'));
			}

			// Create subscription
			const planDetailsRaw = SUBSCRIPTION_PLANS[planType];
			const planDetails: SubscriptionPlanDetails | undefined = planDetailsRaw
				? {
						...planDetailsRaw,
						features: [...planDetailsRaw.features],
					}
				: undefined;
			const startDate = new Date();
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

			const subscription = this.subscriptionRepository.create({
				userId: userId,
				planType: planType,
				status: SubscriptionStatus.ACTIVE,
				startDate: startDate,
				endDate: endDate,
				autoRenew: true,
				nextBillingDate: endDate,
				paymentHistoryId: paymentResult.transactionId,
			});

			await this.subscriptionRepository.save(subscription);

			// Add bonus points if any
			if (planDetails?.pointBonus && planDetails.pointBonus > 0) {
				const user = await this.userRepository.findOne({ where: { id: userId } });
				if (user) {
					user.points = (user.points ?? 0) + planDetails.pointBonus;
					await this.userRepository.save(user);
				}
			}

			logger.payment('Subscription created successfully', {
				userId,
				planType,
				id: paymentResult.transactionId,
			});

			return {
				id: subscription.id,
				subscriptionId: subscription.id,
				planType: subscription.planType,
				planDetails,
				status: subscription.status,
				startDate: subscription.startDate,
				endDate: subscription.endDate,
				billingCycle: null,
				price: planDetails?.price ?? 0,
				features: planDetails?.features ? [...planDetails.features] : [],
				autoRenew: subscription.autoRenew,
				nextBillingDate: subscription.nextBillingDate,
			};
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to subscribe to plan', {
				userId,
				planType,
				error: getErrorMessage(error),
			});
			throw createServerError('create subscription', new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_CREATE_SUBSCRIPTION));
		}
	}

	/**
	 * Cancel subscription
	 * @param userId User ID
	 * @returns Cancellation result
	 */
	async cancelSubscription(userId: string): Promise<boolean> {
		try {
			logger.payment('Cancelling subscription', { userId });

			const subscription = await this.subscriptionRepository.findOne({
				where: { userId: userId, status: SubscriptionStatus.ACTIVE },
			});

			if (!subscription) {
				throw createNotFoundError('Active subscription');
			}

			subscription.status = SubscriptionStatus.CANCELLED;
			subscription.autoRenew = false;
			subscription.cancelledAt = new Date();
			await this.subscriptionRepository.save(subscription);

			logger.payment('Subscription cancelled successfully', { userId });

			return true;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to cancel subscription', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError('cancel subscription', new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_CANCEL_SUBSCRIPTION));
		}
	}

	/**
	 * Handle successful payment
	 * @param userId User ID
	 * @param paymentData Payment data
	 * @param paymentHistory Payment history record
	 */
	private async handlePaymentSuccess(userId: string, paymentData: PaymentData): Promise<void> {
		switch (paymentData.type) {
			case 'subscription':
				// Subscription logic handled in subscribeToPlan
				break;
			case 'points_purchase':
				// Points purchase logic handled in purchasePoints
				break;
			case 'one_time':
				// Handle one-time payment
				break;
			default:
				logger.payment('Unknown payment type', {
					userId,
					paymentType: paymentData.type,
				});
		}
	}

	/**
	 * Simulate payment processing
	 * @param paymentData Payment data
	 * @returns Payment success status
	 */
	private async simulatePaymentProcessing(): Promise<boolean> {
		// Simulate payment processing delay
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Simulate 95% success rate
		return Math.random() > 0.05;
	}

	/**
	 * Generate transaction ID
	 * @returns Transaction ID
	 */
	private generateTransactionId(): string {
		return generatePaymentIntentId();
	}
}
