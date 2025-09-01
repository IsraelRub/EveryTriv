import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { AuthRequest } from '@shared/types';

import { ServerLogger } from '../../../../shared/services/logging';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
	constructor(
		private readonly pointsService: PointsService,
		private readonly logger: ServerLogger
	) {}

	@Get('balance')
	async getPointBalance(@Req() req: AuthRequest) {
		if (!req.user?.id) {
			throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
		}
		const result = this.pointsService.getPointBalance(req.user.id);

		// Log API call for balance check
		this.logger.apiRead('points_balance', {
			userId: req.user.id,
		});

		return result;
	}

	@Get('packages')
	async getPointPackages() {
		const result = this.pointsService.getPointPackages();

		// Log API call for packages request
		this.logger.apiRead('points_packages', {});

		return result;
	}

	@Get('can-play')
	async canPlay(@Req() req: AuthRequest, @Query('questionCount') questionCount: number) {
		if (!req.user?.id) {
			throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
		}
		const result = this.pointsService.canPlay(req.user.id, questionCount);

		// Log API call for can-play check
		this.logger.apiRead('can_play', {
			userId: req.user.id,
			questionCount,
		});

		return result;
	}

	@Post('deduct')
	async deductPoints(@Req() req: AuthRequest, @Body() body: { questionCount: number; gameMode: string }) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}
			const result = await this.pointsService.deductPoints(req.user.id, body.questionCount, body.gameMode);

			// Log API call for points deduction
			this.logger.apiUpdate('points', {
				userId: req.user.id,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
				remainingPoints: result.total_points,
			});

			return result;
		} catch (error) {
			this.logger.apiUpdateError('points', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				questionCount: body.questionCount,
				gameMode: body.gameMode,
			});
			throw error;
		}
	}

	@Get('history')
	async getPointHistory(@Req() req: AuthRequest, @Query('limit') limit: number = 50) {
		if (!req.user?.id) {
			throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
		}
		const result = await this.pointsService.getPointHistory(req.user.id, limit);

		// Log API call for points history request
		this.logger.apiRead('points_history', {
			userId: req.user.id,
			limit,
			transactionsCount: result.length,
		});

		return result;
	}

	@Post('purchase')
	async purchasePoints(@Req() req: AuthRequest, @Body() body: { packageId: string }) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}
			const result = await this.pointsService.purchasePoints(req.user.id, body.packageId);

			// Log API call for points purchase
			this.logger.apiCreate('points_purchase', {
				userId: req.user.id,
				packageId: body.packageId,
			});

			return result;
		} catch (error) {
			this.logger.apiCreateError('points_purchase', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				packageId: body.packageId,
			});
			throw error;
		}
	}

	@Post('confirm-purchase')
	async confirmPointPurchase(@Req() req: AuthRequest, @Body() body: { paymentIntentId: string; points: number }) {
		if (!req.user?.id) {
			throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
		}
		const result = this.pointsService.confirmPointPurchase(req.user.id, body.paymentIntentId, body.points);

		// Log API call for purchase confirmation
		this.logger.apiUpdate('points_purchase', {
			userId: req.user.id,
			paymentIntentId: body.paymentIntentId,
			points: body.points,
		});

		return result;
	}
}
