import { PaymentData, getErrorMessage, serverLogger as logger } from '@shared';

import { Body, Controller, Get, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';

import {
	AuditLog,
	BusinessLog,
	Cache,
	ClientIP,
	CurrentUserId,
	PerformanceThreshold,
	SecurityLog,
	UserAgent,
} from '../../common';
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
	@SecurityLog('critical')
	@AuditLog('payment:create')
	@BusinessLog('payment')
	@PerformanceThreshold(2000)
	async createPayment(
		@CurrentUserId() userId: string,
		@Body() paymentData: CreatePaymentDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
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
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.paymentFailed('unknown', 'Payment creation failed', {
				error: getErrorMessage(error),
				userId,
				planType: paymentData.planType,
				ip,
			});
			throw error;
		}
	}

	/**
	 * Get payment history for user
	 */
	@Get('history')
	@Cache(300) // Cache for 5 minutes
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
