import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { PaymentData , serverLogger as logger } from '@shared';

import {
	AuditLog,
	BusinessLog,
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

			// Log payment attempt with IP and User Agent
			logger.logUserActivity(userId, 'Payment creation attempt', {
				paymentType: paymentData.planType,
				ip,
				userAgent,
			});

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
			logger.apiCreate('payment', {
				userId: userId,
				planType: paymentData.planType,
				success: result.success,
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return {
				paymentId: result.paymentId,
				message: 'Payment session created successfully',
			};
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Get payment history for user
	 */
	@Get('history')
	async getPaymentHistory(@CurrentUserId() userId: string) {
		try {
			const result = await this.paymentService.getPaymentHistory(userId);

			// Log API call for payment history request
			logger.apiRead('payment_history', {
				userId: userId,
				paymentsCount: result.length,
			});

			return result;
		} catch (error) {
			throw error;
		}
	}
}
