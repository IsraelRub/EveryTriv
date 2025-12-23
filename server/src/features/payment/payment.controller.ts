import { Body, Controller, Get, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';

import { API_ROUTES, CACHE_DURATION, ERROR_CODES, PaymentMethod } from '@shared/constants';
import type { ManualPaymentDetails, PaymentData } from '@shared/types';
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
	@Post(API_ROUTES.PAYMENT.CREATE)
	@UsePipes(PaymentDataPipe)
	async createPayment(@CurrentUserId() userId: string, @Body() paymentData: CreatePaymentDto) {
		try {
			const amount = paymentData.amount;
			const description = paymentData.description;

			if (!amount || amount <= 0) {
				throw new HttpException(ERROR_CODES.PAYMENT_AMOUNT_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const manualPayment =
				paymentData.paymentMethod === PaymentMethod.MANUAL_CREDIT
					? this.buildManualPaymentDetails(paymentData)
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
	@Get(API_ROUTES.PAYMENT.HISTORY)
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

	private buildManualPaymentDetails(dto: CreatePaymentDto): ManualPaymentDetails {
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
		const year = 2000 + parseInt(yearPart ?? '0', 10);

		return { month, year };
	}
}
