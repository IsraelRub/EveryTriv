import { Body, Controller, Get, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';

import { CACHE_DURATION, SUBSCRIPTION_PLANS, PlanType } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { PaymentData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUserId } from '../../common';
import { PaymentDataPipe } from '../../common/pipes';
import { CreatePaymentDto } from './dtos';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Create payment session
	 */
	@Post('create')
	@UsePipes(PaymentDataPipe)
	async createPayment(@CurrentUserId() userId: string, @Body() paymentData: CreatePaymentDto) {
		try {
			const isPlanPayment = !!paymentData.planType;
			let amount = paymentData.amount;
			let description = paymentData.description;
			const planType: PlanType | undefined = paymentData.planType;

			if (isPlanPayment) {
				const planDetails = planType ? SUBSCRIPTION_PLANS[planType] : undefined;
				if (!planDetails) {
					throw new HttpException('Invalid subscription plan type', HttpStatus.BAD_REQUEST);
				}
				amount = amount ?? planDetails.price;
				description = description ?? `${planType} subscription`;
			}

			if (!amount || amount <= 0) {
				throw new HttpException('Payment amount is required', HttpStatus.BAD_REQUEST);
			}

			const paymentDataForService: PaymentData = {
				amount,
				currency: paymentData.currency ?? 'USD',
				description: description ?? 'EveryTriv payment',
				planType,
				numberOfPayments: paymentData.numberOfPayments ?? 1,
				metadata: {
					plan: planType,
					paymentMethod: paymentData.paymentMethod ?? 'credit_card',
					tags: paymentData.additionalInfo ? [paymentData.additionalInfo] : undefined,
				},
			};
			const result = await this.paymentService.processPayment(userId, paymentDataForService);

			// Log API call for payment creation
			logger.apiCreate('payment_create', {
				userId,
				planType,
				paymentId: result.paymentId ?? result.transactionId,
				status: result.status,
				amount,
			});

			return result;
		} catch (error) {
			logger.paymentFailed('unknown', 'Payment creation failed', {
				error: getErrorMessage(error),
				userId,
				planType: paymentData.planType,
			});
			throw error;
		}
	}

	/**
	 * Get payment history for user
	 */
	@Get('history')
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getPaymentHistory(@CurrentUserId() userId: string) {
		try {
			const result = await this.paymentService.getPaymentHistory(userId);

			// Log API call for payment history request
			logger.apiRead('payment_history', {
				userId,
				paymentsCount: result.length,
			});

			return result;
		} catch (error) {
			logger.paymentFailed('unknown', 'Error getting payment history', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}
}
