import { Body, Controller, Get, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthRequest, PaymentData, PersonalPaymentData } from 'everytriv-shared/types';

import { LoggerService } from '../../shared/controllers';
import { PaymentService } from './services/payment.service';

@Controller('payment')
export class PaymentController {
	private readonly logger = new LoggerService();

	constructor(private readonly paymentService: PaymentService) {}

	/**
	 * Get pricing plans
	 */
	@Get('plans')
	async getPricingPlans() {
		try {
			return await this.paymentService.getPricingPlans();
		} catch (error) {
			this.logger.apiReadError('pricing_plans', error instanceof Error ? error.message : 'Unknown error', {});
			throw error;
		}
	}

	/**
	 * Create payment session
	 */
	@Post('create')
	async createPayment(
		@Req() req: AuthRequest,
		@Body()
		paymentData: PersonalPaymentData
	) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			// Validate payment data
			if (!paymentData.planType || !['basic', 'premium', 'pro'].includes(paymentData.planType)) {
				throw new HttpException('Invalid plan type', HttpStatus.BAD_REQUEST);
			}

			if (paymentData.numberOfPayments <= 0) {
				throw new HttpException('Invalid number of payments', HttpStatus.BAD_REQUEST);
			}

			if (!paymentData.agreeToTerms) {
				throw new HttpException('Must agree to terms', HttpStatus.BAD_REQUEST);
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
			const result = await this.paymentService.processPayment(req.user.id, paymentDataForService);

			// Log API call for payment creation
			this.logger.apiCreate('payment', {
				userId: req.user.id,
				planType: paymentData.planType,
				success: result.success,
			});

			return {
				success: result.success,
				paymentId: result.paymentId,
				message: 'Payment session created successfully',
			};
		} catch (error) {
			this.logger.apiCreateError('payment', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				planType: paymentData.planType,
			});
			throw error;
		}
	}

	/**
	 * Get payment history for user
	 */
	@Get('history')
	async getPaymentHistory(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.paymentService.getPaymentHistory(req.user.id);

			// Log API call for payment history request
			this.logger.apiRead('payment_history', {
				userId: req.user.id,
				paymentsCount: result.length,
			});

			return result;
		} catch (error) {
			this.logger.apiReadError('payment_history', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
			});
			throw error;
		}
	}
}
