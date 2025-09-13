import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { serverLogger as logger } from '@shared';

import { Cache, ClientIP, CurrentUserId, RateLimit, UserAgent } from '../../common';
import { CanPlayDto, ConfirmPointPurchaseDto, DeductPointsDto, GetPointHistoryDto, PurchasePointsDto } from './dtos';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
	constructor(private readonly pointsService: PointsService) {}

	@Get('balance')
	@Cache(60) // Cache for 1 minute
	async getPointBalance(@CurrentUserId() userId: string) {
		const result = this.pointsService.getPointBalance(userId);

		// Log API call for balance check
		logger.apiRead('points_balance', {
			userId: userId,
		});

		return result;
	}

	@Get('packages')
	@Cache(300) // Cache for 5 minutes
	async getPointPackages() {
		const result = this.pointsService.getPointPackages();

		// Log API call for packages request
		logger.apiRead('points_packages', {});

		return result;
	}

	@Get('can-play')
	@Cache(30) // Cache for 30 seconds
	async canPlay(@CurrentUserId() userId: string, @Query() query: CanPlayDto) {
		const result = this.pointsService.canPlay(userId, query.questionCount);

		// Log API call for can-play check
		logger.apiRead('can_play', {
			userId: userId,
			questionCount: query.questionCount,
		});

		return result;
	}

	@Post('deduct')
	@RateLimit(20, 60) // 20 deductions per minute
	async deductPoints(
		@CurrentUserId() userId: string,
		@Body() body: DeductPointsDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
		try {
			// DTO validation is handled automatically by NestJS
			const result = await this.pointsService.deductPoints(userId, body.questionCount, body.gameMode);

			// Log API call for points deduction with IP and User Agent
			logger.apiUpdate('points', {
				userId: userId,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
				remainingPoints: result.total_points,
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.apiUpdateError('points', error instanceof Error ? error.message : 'Unknown error', {
				userId: userId,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
			});
			throw error;
		}
	}

	@Get('history')
	@Cache(120) // Cache for 2 minutes
	async getPointHistory(@CurrentUserId() userId: string, @Query() query: GetPointHistoryDto) {
		const result = await this.pointsService.getPointHistory(userId, query.limit);

		// Log API call for points history request
		logger.apiRead('points_history', {
			userId: userId,
			limit: query.limit,
			transactionsCount: result.length,
		});

		return result;
	}

	@Post('purchase')
	@RateLimit(5, 60) // 5 purchases per minute
	async purchasePoints(@CurrentUserId() userId: string, @Body() body: PurchasePointsDto) {
		try {
			// DTO validation is handled automatically by NestJS
			const result = await this.pointsService.purchasePoints(userId, body.packageId);

			// Log API call for points purchase
			logger.apiCreate('points_purchase', {
				userId: userId,
				packageId: body.packageId,
			});

			return result;
		} catch (error) {
			logger.apiCreateError('points_purchase', error instanceof Error ? error.message : 'Unknown error', {
				userId: userId,
				packageId: body.packageId,
			});
			throw error;
		}
	}

	@Post('confirm-purchase')
	@RateLimit(10, 60) // 10 confirmations per minute
	async confirmPointPurchase(@CurrentUserId() userId: string, @Body() body: ConfirmPointPurchaseDto) {
		// DTO validation is handled automatically by NestJS
		const result = this.pointsService.confirmPointPurchase(userId, body.paymentIntentId, body.points);

		// Log API call for purchase confirmation
		logger.apiUpdate('points_purchase', {
			userId: userId,
			paymentIntentId: body.paymentIntentId,
			points: body.points,
		});

		return result;
	}
}
