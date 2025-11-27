import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post, UseGuards, UsePipes } from '@nestjs/common';

import { CACHE_DURATION } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { AuthGuard, Cache, CurrentUserId } from '../../common';
import { PaymentDataPipe } from '../../common/pipes';
import { CreateSubscriptionDto } from './dtos';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	/**
	 * Get available subscription plans
	 * @returns Available subscription plans
	 */
	@Get('plans')
	@Cache(CACHE_DURATION.VERY_LONG) // Cache for 2 hours - subscription plans rarely change
	async getAvailablePlans() {
		try {
			const result = await this.subscriptionService.getAvailablePlans();

			logger.apiRead('subscription_plans', {
				plansCount: Array.isArray(result) ? result.length : Object.keys(result).length,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting subscription plans', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get current subscription for user
	 * @param userId Current user identifier
	 * @returns Current subscription data
	 */
	@Get('current')
	@UseGuards(AuthGuard)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getCurrentSubscription(@CurrentUserId() userId: string) {
		try {
			const result = await this.subscriptionService.getCurrentSubscription(userId);

			logger.apiRead('subscription_current', {
				userId,
				planType: result?.planType,
				status: result?.status,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting current subscription', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Create new subscription
	 * @param userId Current user identifier
	 * @param body Subscription creation data
	 * @returns Subscription creation result
	 */
	@Post('create')
	@UseGuards(AuthGuard)
	@UsePipes(PaymentDataPipe)
	async createSubscription(@CurrentUserId() userId: string, @Body() body: CreateSubscriptionDto) {
		try {
			if (!body.planType) {
				throw new HttpException('Plan type is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.subscriptionService.createSubscription(userId, body);

			// Log API call for subscription creation
			logger.apiCreate('subscription_create', {
				userId,
				planType: body.planType,
				billingCycle: body.billingCycle || 'monthly',
				paymentMethod: body.paymentMethod,
			});

			return result;
		} catch (error) {
			logger.userError('Error creating subscription', {
				error: getErrorMessage(error),
				userId,
				planType: body.planType,
				billingCycle: body.billingCycle || 'monthly',
			});
			throw error;
		}
	}

	/**
	 * Cancel subscription
	 * @param userId Current user identifier
	 * @returns Subscription cancellation result
	 */
	@Delete('cancel')
	@UseGuards(AuthGuard)
	async cancelSubscription(@CurrentUserId() userId: string) {
		try {
			const result = await this.subscriptionService.cancelSubscription(userId);

			// Log API call for subscription cancellation
			logger.apiDelete('subscription_cancel', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error canceling subscription', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}
}
