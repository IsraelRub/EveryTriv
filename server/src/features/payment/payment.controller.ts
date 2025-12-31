import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';

import { API_ROUTES, CACHE_DURATION, ERROR_CODES, PaymentMethod } from '@shared/constants';
import type { PaymentData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import { Cache, CurrentUserId } from '../../common';
import { PaymentDataPipe } from '../../common/pipes';
import { CreatePaymentDto } from './dtos';
import { PaymentService } from './payment.service';

@Controller(API_ROUTES.PAYMENT.BASE)
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Create payment session
	 * @param userId Current user identifier
	 * @param paymentData Payment creation data
	 * @returns Payment processing result
	 */
	@Post('create')
	async createPayment(@CurrentUserId() userId: string, @Body(PaymentDataPipe) paymentData: CreatePaymentDto) {
		try {
			const amount = paymentData.amount;
			const description = paymentData.description;

			if (!amount || amount <= 0) {
				throw new HttpException(ERROR_CODES.PAYMENT_AMOUNT_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const manualPayment =
				paymentData.paymentMethod === PaymentMethod.MANUAL_CREDIT
					? this.paymentService.buildManualPaymentDetails(paymentData)
					: undefined;
			const paymentDataForService: PaymentData = {
				amount,
				currency: paymentData.currency ?? 'USD',
				description: description ?? 'EveryTriv payment',
				metadata: {
					paymentMethod: paymentData.paymentMethod,
					tags: paymentData.additionalInfo ? [paymentData.additionalInfo] : undefined,
				},
				method: paymentData.paymentMethod,
				manualPayment,
				paypalOrderId: paymentData.paymentMethod === PaymentMethod.PAYPAL ? paymentData.paypalOrderId : undefined,
				paypalPaymentId: paymentData.paymentMethod === PaymentMethod.PAYPAL ? paymentData.paypalPaymentId : undefined,
			};
			const result = await this.paymentService.processPayment(userId, paymentDataForService);

			// Log API call for payment creation
			logger.apiCreate('payment_create', {
				userId,
				paymentId: result.paymentId ?? result.transactionId,
				status: result.status,
				amount,
			});

			return result;
		} catch (error) {
			logger.paymentFailed('unknown', 'Payment creation failed', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get payment history for user
	 * @param userId Current user identifier
	 * @returns Payment history list
	 */
	@Get('history')
	@Cache(CACHE_DURATION.MEDIUM)
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
