/**
 * Payment Service
 *
 * @module PaymentService
 * @description Service for handling payment operations and subscription management
 * @used_by server/src/features/payment/payment.controller.ts
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PAYMENT_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import type {
	PaymentData,
	PaymentResult,
	PointBalance,
	PointPurchaseOption,
	SubscriptionData,
	SubscriptionPlans,
} from 'everytriv-shared/types';
import { formatCurrency, generatePaymentIntentId } from 'everytriv-shared/utils';
import { Repository } from 'typeorm';

import { LoggerService } from '../../../shared/controllers';
import { ServerStorageService } from '../../../shared/modules/storage/storage.service';
import { UserEntity } from '../../user/entities/user.entity';
import { PaymentHistoryEntity } from '../entities/payment-history.entity';
import { SubscriptionEntity } from '../entities/subscription.entity';

/**
 * Pricing plans configuration
 */
const PRICING_PLANS: SubscriptionPlans = {
	basic: {
		price: 9.99,
		currency: 'USD',
		interval: 'month',
		features: ['Unlimited trivia questions', 'Basic analytics', 'Email support'],
		pointBonus: 100,
		questionLimit: 1000,
	},
	premium: {
		price: 19.99,
		currency: 'USD',
		interval: 'month',
		features: [
			'Unlimited trivia questions',
			'Advanced analytics',
			'Priority support',
			'Custom difficulty levels',
			'Export functionality',
		],
		pointBonus: 250,
		questionLimit: -1, // Unlimited
	},
	pro: {
		name: 'Pro Plan',
		price: 39.99,
		currency: 'USD',
		interval: 'month',
		features: [
			'Everything in Premium',
			'API access',
			'White-label options',
			'Dedicated support',
			'Custom integrations',
		],
		pointBonus: 500,
		questionLimit: -1, // Unlimited
	},
	enterprise: {
		name: 'Enterprise Plan',
		price: 49.99,
		currency: 'USD',
		interval: 'month',
		features: [
			'Everything in Pro',
			'Advanced API access',
			'Custom integrations',
			'Priority support',
			'Custom branding',
		],
		pointBonus: 1000,
		questionLimit: -1, // Unlimited
	},
};

/**
 * Point purchase options
 */
const POINT_PURCHASE_OPTIONS: PointPurchaseOption[] = [
	{ id: 'points_100', points: 100, price: 4.99, price_display: formatCurrency(4.99), price_per_point: 0.0499 },
	{ id: 'points_250', points: 250, price: 9.99, price_display: formatCurrency(9.99), price_per_point: 0.03996 },
	{ id: 'points_500', points: 500, price: 18.99, price_display: formatCurrency(18.99), price_per_point: 0.03798 },
	{ id: 'points_1000', points: 1000, price: 34.99, price_display: formatCurrency(34.99), price_per_point: 0.03499 },
	{ id: 'points_2000', points: 2000, price: 64.99, price_display: formatCurrency(64.99), price_per_point: 0.032495 },
];

@Injectable()
export class PaymentService {
	constructor(
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
		@InjectRepository(SubscriptionEntity)
		private readonly subscriptionRepository: Repository<SubscriptionEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly logger: LoggerService,
		private readonly storageService: ServerStorageService
	) {}

	/**
	 * Get available pricing plans
	 * @returns Available subscription plans
	 */
	async getPricingPlans(): Promise<SubscriptionPlans> {
		try {
			this.logger.payment('Getting pricing plans');

			// Check if we have cached plans
			const cachedPlans = await this.storageService.get<SubscriptionPlans>('pricing_plans');
			if (cachedPlans.success && cachedPlans.data) {
				return cachedPlans.data;
			}

			// Cache plans for 1 hour
			await this.storageService.set('pricing_plans', PRICING_PLANS, 3600);

			return PRICING_PLANS;
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to get pricing plans', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_PRICING_PLANS);
		}
	}

	/**
	 * Get point purchase options
	 * @returns Available point purchase options
	 */
	async getPointPurchaseOptions(): Promise<PointPurchaseOption[]> {
		try {
			this.logger.payment('Getting point purchase options');

			// Check if we have cached options
			const cachedOptions = await this.storageService.get<PointPurchaseOption[]>('point_purchase_options');
			if (cachedOptions.success && cachedOptions.data) {
				return cachedOptions.data;
			}

			// Cache options for 1 hour
			await this.storageService.set('point_purchase_options', POINT_PURCHASE_OPTIONS, 3600);

			return POINT_PURCHASE_OPTIONS;
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to get point purchase options', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_POINT_OPTIONS);
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
			this.logger.payment('Processing payment', { userId, paymentType: paymentData.planType || 'unknown' });

			// Validate payment data
			if (!paymentData.amount || paymentData.amount <= 0) {
				throw new Error(PAYMENT_ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
			}

			// Create payment history record
			const paymentHistory = this.paymentHistoryRepository.create({
				user_id: userId,
				amount: paymentData.amount,
				currency: paymentData.currency || 'USD',
				payment_type: paymentData.planType || 'unknown',
				status: 'pending',
				payment_method: 'credit_card',
				transaction_id: this.generateTransactionId(),
			});

			await this.paymentHistoryRepository.save(paymentHistory);
			this.logger.databaseCreate('payment_history', {
				transactionId: paymentHistory.transaction_id,
				userId,
				amount: paymentData.amount,
			});

			// Simulate payment processing
			const paymentSuccess = await this.simulatePaymentProcessing();

			if (paymentSuccess) {
				// Update payment status
				paymentHistory.status = 'completed';
				paymentHistory.completed_at = new Date();
				await this.paymentHistoryRepository.save(paymentHistory);

				// Handle payment type specific logic
				await this.handlePaymentSuccess(userId, paymentData);

				this.logger.payment('Payment processed successfully', {
					userId,
					transactionId: paymentHistory.transaction_id,
					amount: paymentData.amount,
				});

				return {
					success: true,
					transactionId: paymentHistory.transaction_id,
					status: 'completed',
					message: 'Payment processed successfully',
					amount: paymentData.amount,
					currency: paymentData.currency || 'USD',
				};
			} else {
				// Update payment status
				paymentHistory.status = 'failed';
				paymentHistory.failed_at = new Date();
				await this.paymentHistoryRepository.save(paymentHistory);

				this.logger.paymentFailed(paymentHistory.transaction_id, 'Payment processing failed', {
					userId,
					transactionId: paymentHistory.transaction_id,
				});

				return {
					success: false,
					transactionId: paymentHistory.transaction_id,
					status: 'failed',
					message: 'Payment processing failed',
					amount: paymentData.amount,
					currency: paymentData.currency || 'USD',
				};
			}
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Payment processing error', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED);
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
			this.logger.payment('Getting payment history', { userId, limit, offset });

			const payments = await this.paymentHistoryRepository.find({
				where: { user_id: userId },
				order: { created_at: 'DESC' },
				take: limit,
				skip: offset,
			});

			return payments;
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to get payment history', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_PAYMENT_HISTORY);
		}
	}

	/**
	 * Get subscription details for user
	 * @param userId User ID
	 * @returns Subscription details
	 */
	async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
		try {
			this.logger.payment('Getting user subscription', { userId });

			const subscription = await this.subscriptionRepository.findOne({
				where: { user_id: userId, status: 'active' },
				order: { created_at: 'DESC' },
			});

			if (!subscription) {
				return null;
			}

			const planDetails = PRICING_PLANS[subscription.plan_type as keyof SubscriptionPlans];

			return {
				id: subscription.id,
				subscriptionId: subscription.id,
				planType: subscription.plan_type,
				plan: subscription.plan_type as 'free' | 'basic' | 'premium' | 'pro',
				planDetails,
				status: subscription.status,
				startDate: subscription.start_date.toISOString(),
				endDate: subscription.end_date.toISOString(),
				billingCycle: null,
				price: planDetails?.price || 0,
				features: planDetails?.features || [],
				autoRenew: subscription.auto_renew,
				nextBillingDate: subscription.next_billing_date,
			};
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to get user subscription', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_RETRIEVE_SUBSCRIPTION);
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
			this.logger.payment('Purchasing points', { userId, optionId });

			const options = await this.getPointPurchaseOptions();
			const selectedOption = options.find(opt => opt.id === optionId);

			if (!selectedOption) {
				throw new Error(PAYMENT_ERROR_MESSAGES.INVALID_POINT_OPTION);
			}

			// Process payment
			const paymentResult = await this.processPayment(userId, {
				amount: selectedOption.price,
				currency: selectedOption.currency || 'USD',
				description: `Points purchase: ${selectedOption.points} points`,
				metadata: {
					optionId,
					points: selectedOption.points,
					bonus: selectedOption.bonus || 0,
				},
			});

			if (!paymentResult.success) {
				throw new Error('Payment failed');
			}

			// Update user points
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error(PAYMENT_ERROR_MESSAGES.USER_NOT_FOUND);
			}

			const totalPoints = selectedOption.points + (selectedOption.bonus || 0);
			user.points = (user.points || 0) + totalPoints;
			await this.userRepository.save(user);

			this.logger.payment('Points purchased successfully', {
				userId,
				points: totalPoints,
				transactionId: paymentResult.transactionId,
			});

			return {
				total_points: user.points || 0,
				free_questions: 0, // Default value since property doesn't exist
				purchased_points: 0, // Default value since property doesn't exist
				daily_limit: 10,
				can_play_free: true, // Default value
				next_reset_time: null,
				userId,
				balance: user.points,
				lastUpdated: new Date(),
			};
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to purchase points', {
				userId,
				optionId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_PURCHASE_POINTS);
		}
	}

	/**
	 * Subscribe to a plan
	 * @param userId User ID
	 * @param planType Plan type
	 * @param paymentData Payment data
	 * @returns Subscription result
	 */
	async subscribeToPlan(userId: string, planType: string, paymentData: PaymentData): Promise<SubscriptionData> {
		try {
			this.logger.payment('Subscribing to plan', { userId, planType });

			// Validate plan type
			if (!PRICING_PLANS[planType as keyof SubscriptionPlans]) {
				throw new Error(PAYMENT_ERROR_MESSAGES.INVALID_PLAN_TYPE);
			}

			// Process payment
			const paymentResult = await this.processPayment(userId, {
				...paymentData,
				type: 'subscription',
				metadata: { planType },
			});

			if (!paymentResult.success) {
				throw new Error('Payment failed');
			}

			// Create subscription
			const planDetails = PRICING_PLANS[planType as keyof SubscriptionPlans];
			const startDate = new Date();
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

			const subscription = this.subscriptionRepository.create({
				user_id: userId,
				plan_type: planType,
				status: 'active',
				start_date: startDate,
				end_date: endDate,
				auto_renew: true,
				next_billing_date: endDate,
				payment_history_id: paymentResult.transactionId,
			});

			await this.subscriptionRepository.save(subscription);

			// Add bonus points if any
			if (planDetails.pointBonus && planDetails.pointBonus > 0) {
				const user = await this.userRepository.findOne({ where: { id: userId } });
				if (user) {
					user.points = (user.points || 0) + planDetails.pointBonus;
					await this.userRepository.save(user);
				}
			}

			this.logger.payment('Subscription created successfully', {
				userId,
				planType,
				transactionId: paymentResult.transactionId,
			});

			return {
				id: subscription.id,
				subscriptionId: subscription.id,
				planType: subscription.plan_type,
				plan: subscription.plan_type as 'free' | 'basic' | 'premium' | 'pro',
				planDetails,
				status: subscription.status,
				startDate: subscription.start_date.toISOString(),
				endDate: subscription.end_date.toISOString(),
				billingCycle: null,
				price: planDetails?.price || 0,
				features: planDetails?.features || [],
				autoRenew: subscription.auto_renew,
				nextBillingDate: subscription.next_billing_date,
			};
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to subscribe to plan', {
				userId,
				planType,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_CREATE_SUBSCRIPTION);
		}
	}

	/**
	 * Cancel subscription
	 * @param userId User ID
	 * @returns Cancellation result
	 */
	async cancelSubscription(userId: string): Promise<boolean> {
		try {
			this.logger.payment('Cancelling subscription', { userId });

			const subscription = await this.subscriptionRepository.findOne({
				where: { user_id: userId, status: 'active' },
			});

			if (!subscription) {
				throw new Error(PAYMENT_ERROR_MESSAGES.NO_ACTIVE_SUBSCRIPTION);
			}

			subscription.status = 'cancelled';
			subscription.auto_renew = false;
			subscription.cancelled_at = new Date();
			await this.subscriptionRepository.save(subscription);

			this.logger.payment('Subscription cancelled successfully', { userId });

			return true;
		} catch (error) {
			this.logger.paymentFailed('unknown', 'Failed to cancel subscription', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error(PAYMENT_ERROR_MESSAGES.FAILED_TO_CANCEL_SUBSCRIPTION);
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
				this.logger.payment('Unknown payment type', {
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
