import { Body, Controller, Get, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';

import { CACHE_DURATION } from '@shared/constants';
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
			// DTO validation is handled automatically by NestJS
			if (!paymentData.planType) {
				throw new HttpException('Plan type is required', HttpStatus.BAD_REQUEST);
			}

			// Create payment
			const paymentDataForService: PaymentData = {
				amount: 0, // Will be calculated by service
				currency: 'USD',
				description: `${paymentData.planType} subscription`,
				planType: paymentData.planType,
				numberOfPayments: paymentData.numberOfPayments,
				metadata: {
					plan: paymentData.planType,
					paymentMethod: 'credit_card',
				},
			};
			const result = await this.paymentService.processPayment(userId, paymentDataForService);

			// Log API call for payment creation
			logger.apiCreate('payment_create', {
				userId,
				planType: paymentData.planType,
				paymentId: result.paymentId,
				status: result.status,
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
