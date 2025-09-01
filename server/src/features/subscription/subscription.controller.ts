import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthRequest } from '@shared/types';

import { ServerLogger } from '../../../../shared/services/logging';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
	constructor(
		private readonly subscriptionService: SubscriptionService,
		private readonly logger: ServerLogger
	) {}

	/**
	 * Get available subscription plans
	 */
	@Get('plans')
	async getAvailablePlans() {
		return await this.subscriptionService.getAvailablePlans();
	}

	/**
	 * Get current subscription for user
	 */
	@Get('current')
	async getCurrentSubscription(@Req() req: AuthRequest) {
		if (!req.user?.id) {
			throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
		}

		return await this.subscriptionService.getCurrentSubscription(req.user.id);
	}

	/**
	 * Create new subscription
	 */
	@Post('create')
	async createSubscription(@Req() req: AuthRequest, @Body() body: { plan: string; billingCycle?: string }) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			if (!body.plan) {
				throw new HttpException('Plan is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.subscriptionService.createSubscription(
				req.user.id,
				body.plan,
				body.billingCycle || 'monthly'
			);

			// Log API call for subscription creation
			this.logger.apiCreate('subscription', {
				userId: req.user.id,
				plan: body.plan,
				billingCycle: body.billingCycle || 'monthly',
			});

			return result;
		} catch (error) {
			this.logger.apiCreateError('subscription', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				plan: body.plan,
				billingCycle: body.billingCycle || 'monthly',
			});
			throw error;
		}
	}

	/**
	 * Cancel subscription
	 */
	@Delete('cancel')
	async cancelSubscription(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.subscriptionService.cancelSubscription(req.user.id);

			// Log API call for subscription cancellation
			this.logger.apiDelete('subscription', {
				userId: req.user.id,
			});

			return result;
		} catch (error) {
			this.logger.apiDeleteError('subscription', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
			});
			throw error;
		}
	}
}
