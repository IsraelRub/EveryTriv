import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BillingCycle, PaymentMethod, PaymentStatus, PlanType, SubscriptionStatus } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { ManualPaymentDetails, SubscriptionData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { UserEntity } from '@internal/entities';

import { PaymentService } from '../payment';
import type { CreateSubscriptionDto } from './dtos';

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
				planType: defaultSubscription.planType,
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
	 * @param dto Subscription creation payload
	 * @returns Created subscription
	 */
	async createSubscription(userId: string, dto: CreateSubscriptionDto) {
		const plan = dto.planType;
		const billingCycle = dto.billingCycle || BillingCycle.MONTHLY;

		try {
			logger.payment('Creating subscription', {
				userId,
				planType: plan,
				billingCycle,
				paymentMethod: dto.paymentMethod,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const startDate = new Date();
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + (billingCycle === BillingCycle.YEARLY ? 12 : 1));

			const planDetails = this.getPlanDetails(plan);
			const subscriptionData: SubscriptionData = {
				subscriptionId,
				planType: plan,
				status: SubscriptionStatus.ACTIVE,
				startDate: startDate,
				endDate: endDate,
				price: planDetails.price,
				billingCycle,
				features: planDetails.features,
				autoRenew: dto.autoRenewal ?? true,
			};

			const manualPayment =
				dto.paymentMethod === PaymentMethod.MANUAL_CREDIT ? this.buildManualPaymentDetails(dto) : undefined;

			const paymentResult = await this.paymentService.processPayment(userId, {
				amount: planDetails.price,
				currency: 'USD',
				description: `Subscription to ${plan} plan`,
				planType: plan,
				numberOfPayments: billingCycle === BillingCycle.YEARLY ? 12 : 1,
				metadata: {
					subscriptionId,
					plan,
					billingCycle,
					price: planDetails.price,
				},
				method: dto.paymentMethod,
				manualPayment,
				paypalOrderId: dto.paymentMethod === PaymentMethod.PAYPAL ? dto.paypalOrderId : undefined,
				paypalPaymentId: dto.paymentMethod === PaymentMethod.PAYPAL ? dto.paypalPaymentId : undefined,
			});

			if (paymentResult.status !== PaymentStatus.COMPLETED) {
				return {
					subscriptionId: null,
					endDate: null,
					billingCycle,
					planType: plan,
					status: SubscriptionStatus.PENDING,
					startDate,
					price: planDetails.price,
					features: [...planDetails.features],
					autoRenew: dto.autoRenewal ?? true,
					nextBillingDate: undefined,
					cancelledAt: undefined,
					planDetails: {
						...planDetails,
						features: [...planDetails.features],
					},
					paymentMethod: dto.paymentMethod,
					paypalTransactionId: paymentResult.paypalOrderId,
					paypalOrderId: paymentResult.paypalOrderId,
					manualCaptureReference: paymentResult.manualCaptureReference,
					paymentId: paymentResult.transactionId,
				};
			}

			await this.userRepository.update(userId, {
				currentSubscriptionId: subscriptionId,
			});

			logger.payment('Subscription created successfully', {
				userId,
				id: subscriptionId,
			});

			return {
				...subscriptionData,
				paymentId: paymentResult.paymentId ?? paymentResult.transactionId,
				paymentMethod: dto.paymentMethod,
				paypalTransactionId: paymentResult.paypalOrderId,
				paypalOrderId: paymentResult.paypalOrderId,
				manualCaptureReference: paymentResult.manualCaptureReference,
			};
		} catch (error) {
			logger.paymentFailed('subscription-create', 'Failed to create subscription', {
				error: getErrorMessage(error),
				userId,
				id: plan,
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
				id: userId,
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new NotFoundException('User not found');
			}

			const defaultSubscription = this.getDefaultSubscription();
			defaultSubscription.status = 'cancelled';
			defaultSubscription.cancelledAt = new Date();

			await this.userRepository.update(userId, {
				currentSubscriptionId: undefined,
			});

			return { message: 'Subscription cancelled successfully' };
		} catch (error) {
			logger.paymentFailed('subscription-cancel', 'Failed to cancel subscription', {
				error: getErrorMessage(error),
				userId,
				id: userId,
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
			planType: PlanType.BASIC,
			status: SubscriptionStatus.ACTIVE,
			startDate: new Date(),
			endDate: null,
			price: 0,
			billingCycle: null,
			features: ['basic_questions'],
		};
	}

	/**
	 * Get plan details by plan name
	 * @param plan Plan type
	 * @returns Plan details
	 */
	private getPlanDetails(plan: PlanType) {
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

		return plans[plan] || plans.basic;
	}

	private buildManualPaymentDetails(dto: CreateSubscriptionDto): ManualPaymentDetails {
		const { month, year } = this.parseExpiryDate(dto.expiryDate);

		return {
			cardNumber: dto.cardNumber ?? '',
			expiryMonth: month,
			expiryYear: year,
			cvv: dto.cvv ?? '',
			cardHolderName: dto.cardHolderName ?? '',
			postalCode: dto.postalCode,
			expiryDate: dto.expiryDate,
		};
	}

	private parseExpiryDate(expiryDate?: string): { month: number; year: number } {
		if (!expiryDate) {
			return { month: 0, year: 0 };
		}

		const [monthPart, yearPart] = expiryDate.split('/');
		const month = parseInt(monthPart ?? '0', 10);
		const yearDigits = parseInt(yearPart ?? '0', 10);

		return {
			month,
			year: 2000 + (Number.isNaN(yearDigits) ? 0 : yearDigits),
		};
	}
}
