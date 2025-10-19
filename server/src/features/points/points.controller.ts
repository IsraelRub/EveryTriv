import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { CACHE_DURATION } from '@shared/constants';

import { Cache, ClientIP, CurrentUserId, RateLimit, UserAgent } from '../../common';
import { CanPlayDto, ConfirmPointPurchaseDto, DeductPointsDto, GetPointHistoryDto, PurchasePointsDto } from './dtos';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
	constructor(private readonly pointsService: PointsService) {}

	/**
	 * Get user point balance
	 */
	@Get('balance')
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
	async getPointBalance(@CurrentUserId() userId: string) {
		try {
			const result = this.pointsService.getPointBalance(userId);

			// Log API call for balance check
			logger.apiRead('points_balance', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting point balance', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get available point packages
	 */
	@Get('packages')
	@Cache(CACHE_DURATION.VERY_LONG) // Cache for 1 hour - point packages rarely change
	async getPointPackages() {
		try {
			const result = this.pointsService.getPointPackages();

			// Log API call for packages request
			logger.apiRead('points_packages', {});

			return result;
		} catch (error) {
			logger.userError('Error getting point packages', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Check if user can play with given question count
	 */
	@Get('can-play')
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
	async canPlay(@CurrentUserId() userId: string, @Query() query: CanPlayDto) {
		try {
			if (!query.questionCount || query.questionCount <= 0) {
				throw new HttpException('Valid question count is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.pointsService.canPlay(userId, query.questionCount);

			// Log API call for can-play check
			logger.apiRead('points_can_play', {
				userId,
				questionCount: query.questionCount,
				canPlay: result.canPlay,
			});

			return result;
		} catch (error) {
			logger.userError('Error checking can play', {
				error: getErrorMessage(error),
				userId,
				questionCount: query.questionCount,
			});
			throw error;
		}
	}

	/**
	 * Deduct points from user
	 */
	@Post('deduct')
	@RateLimit(20, 60) // 20 deductions per minute
	async deductPoints(
		@CurrentUserId() userId: string,
		@Body() body: DeductPointsDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
		try {
			if (!body.questionCount || body.questionCount <= 0) {
				throw new HttpException('Valid question count is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.pointsService.deductPoints(userId, body.questionCount, body.gameMode);

			// Log API call for points deduction with IP and User Agent
			logger.apiUpdate('points_deduct', {
				userId,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
				remainingPoints: result.total_points,
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.userError('Error deducting points', {
				error: getErrorMessage(error),
				userId,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
			});
			throw error;
		}
	}

	/**
	 * Get user point transaction history
	 */
	@Get('history')
	@Cache(CACHE_DURATION.SHORT + 90) // Cache for 2 minutes
	async getPointHistory(@CurrentUserId() userId: string, @Query() query: GetPointHistoryDto) {
		try {
			const limit = query.limit || 50;
			if (limit > 100) {
				throw new HttpException('Limit cannot exceed 100', HttpStatus.BAD_REQUEST);
			}

			const result = await this.pointsService.getPointHistory(userId, limit);

			// Log API call for points history request
			logger.apiRead('points_history', {
				userId,
				limit,
				transactionsCount: result.length,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting point history', {
				error: getErrorMessage(error),
				userId,
				limit: query.limit,
			});
			throw error;
		}
	}

	/**
	 * Purchase points package
	 */
	@Post('purchase')
	@RateLimit(5, 60) // 5 purchases per minute
	async purchasePoints(@CurrentUserId() userId: string, @Body() body: PurchasePointsDto) {
		try {
			if (!body.packageId) {
				throw new HttpException('Package ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.pointsService.purchasePoints(userId, body.packageId);

			// Log API call for points purchase
			logger.apiCreate('points_purchase', {
				userId,
				packageId: body.packageId,
			});

			return result;
		} catch (error) {
			logger.userError('Error purchasing points', {
				error: getErrorMessage(error),
				userId,
				packageId: body.packageId,
			});
			throw error;
		}
	}

	/**
	 * Confirm point purchase
	 */
	@Post('confirm-purchase')
	@RateLimit(10, 60) // 10 confirmations per minute
	async confirmPointPurchase(@CurrentUserId() userId: string, @Body() body: ConfirmPointPurchaseDto) {
		try {
			if (!body.paymentIntentId || !body.points) {
				throw new HttpException('Payment intent ID and points are required', HttpStatus.BAD_REQUEST);
			}

			const result = this.pointsService.confirmPointPurchase(userId, body.paymentIntentId, body.points);

			// Log API call for purchase confirmation
			logger.apiUpdate('points_purchase_confirm', {
				userId,
				paymentIntentId: body.paymentIntentId,
				points: body.points,
			});

			return result;
		} catch (error) {
			logger.userError('Error confirming point purchase', {
				error: getErrorMessage(error),
				userId,
				paymentIntentId: body.paymentIntentId,
			});
			throw error;
		}
	}
}
