import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { serverLogger as logger, getErrorMessage } from '@shared';

import { CurrentUserId } from '../../common';
import { AuthGuard } from '../../common/guards';
import { CreateSubscriptionDto } from './dtos';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

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
	@UseGuards(AuthGuard)
	async getCurrentSubscription(@CurrentUserId() userId: string) {
		return await this.subscriptionService.getCurrentSubscription(userId);
	}

	/**
	 * Create new subscription
	 */
	@Post('create')
	@UseGuards(AuthGuard)
	async createSubscription(@CurrentUserId() userId: string, @Body() body: CreateSubscriptionDto) {
		try {
			const result = await this.subscriptionService.createSubscription(
				userId,
				body.planType,
				body.billingCycle || 'monthly'
			);

			// Log API call for subscription creation
			logger.apiCreate('subscription', {
				userId: userId,
				plan: body.planType,
				billingCycle: body.billingCycle || 'monthly',
			});

			return result;
		} catch (error) {
			logger.apiCreateError('subscription', getErrorMessage(error), {
				userId: userId,
				plan: body.planType,
				billingCycle: body.billingCycle || 'monthly',
			});
			throw error;
		}
	}

	/**
	 * Cancel subscription
	 */
	@Delete('cancel')
	@UseGuards(AuthGuard)
	async cancelSubscription(@CurrentUserId() userId: string) {
		try {
			const result = await this.subscriptionService.cancelSubscription(userId);

			// Log API call for subscription cancellation
			logger.apiDelete('subscription', {
				userId: userId,
			});

			return result;
		} catch (error) {
			logger.apiDeleteError('subscription', getErrorMessage(error), {
				userId: userId,
			});
			throw error;
		}
	}
}
