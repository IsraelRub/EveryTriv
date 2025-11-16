import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';

import { CACHE_DURATION, DEFAULT_USER_PREFERENCES, GameMode, PaymentMethod } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { ManualPaymentDetails } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUserId, NoCache } from '../../common';
import { CanPlayDto, ConfirmPointPurchaseDto, DeductPointsDto, GetPointHistoryDto, PurchasePointsDto } from './dtos';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
	constructor(private readonly pointsService: PointsService) {}

	/**
	 * Get user point balance
	 */
	@Get('balance')
	@NoCache()
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
			const questionCount = query.questionCount ?? DEFAULT_USER_PREFERENCES.game?.questionLimit ?? 5;

			if (!questionCount || questionCount <= 0) {
				throw new HttpException('Valid question count is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.pointsService.canPlay(userId, questionCount);

			// Log API call for can-play check
			logger.apiRead('points_can_play', {
				userId,
				questionCount,
				canPlay: result.canPlay,
				gameMode: query.gameMode ?? GameMode.QUESTION_LIMITED,
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
	async deductPoints(@CurrentUserId() userId: string, @Body() body: DeductPointsDto) {
		try {
			const questionCount = body.questionCount ?? body.amount;
			if (!questionCount || questionCount <= 0) {
				throw new HttpException('Valid question count is required', HttpStatus.BAD_REQUEST);
			}

			const gameMode = body.gameMode ?? body.gameType ?? GameMode.QUESTION_LIMITED;

			const result = await this.pointsService.deductPoints(userId, questionCount, gameMode, body.reason);

			// Log API call for points deduction with IP and User Agent
			logger.apiUpdate('points_deduct', {
				userId,
				questionCount,
				gameMode,
				reason: body.reason,
				remainingPoints: result.totalPoints,
			});

			return result;
		} catch (error) {
			logger.userError('Error deducting points', {
				error: getErrorMessage(error),
				userId,
				questionCount: body.questionCount ?? body.amount,
				gameMode: body.gameMode ?? body.gameType,
				reason: body.reason,
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
	async purchasePoints(@CurrentUserId() userId: string, @Body() body: PurchasePointsDto) {
		try {
			if (!body.packageId) {
				throw new HttpException('Package ID is required', HttpStatus.BAD_REQUEST);
			}

			const manualPayment =
				body.paymentMethod === PaymentMethod.MANUAL_CREDIT ? this.buildManualPaymentDetails(body) : undefined;
			const result = await this.pointsService.purchasePoints(userId, {
				packageId: body.packageId,
				paymentMethod: body.paymentMethod,
				paypalOrderId: body.paypalOrderId,
				paypalPaymentId: body.paypalPaymentId,
				manualPayment,
			});

			// Log API call for points purchase
			logger.apiCreate('points_purchase', {
				userId,
				id: body.packageId,
			});

			return result;
		} catch (error) {
			logger.userError('Error purchasing points', {
				error: getErrorMessage(error),
				userId,
				id: body.packageId,
			});
			throw error;
		}
	}

	/**
	 * Confirm point purchase
	 */
	@Post('confirm-purchase')
	async confirmPointPurchase(@CurrentUserId() userId: string, @Body() body: ConfirmPointPurchaseDto) {
		try {
			const paymentIdentifier = body.paymentIntentId ?? body.transactionId ?? body.paymentId;
			if (!paymentIdentifier || !body.points || body.points <= 0) {
				throw new HttpException('Payment intent ID and points are required', HttpStatus.BAD_REQUEST);
			}

			const result = this.pointsService.confirmPointPurchase(userId, paymentIdentifier, body.points);

			// Log API call for purchase confirmation
			logger.apiUpdate('points_purchase_confirm', {
				userId,
				id: paymentIdentifier,
				points: body.points,
			});

			return result;
		} catch (error) {
			logger.userError('Error confirming point purchase', {
				error: getErrorMessage(error),
				userId,
				id: body.paymentIntentId ?? body.transactionId ?? body.paymentId,
			});
			throw error;
		}
	}

	private buildManualPaymentDetails(body: PurchasePointsDto): ManualPaymentDetails {
		const { month, year } = this.parseExpiryDate(body.expiryDate);

		return {
			cardNumber: body.cardNumber ?? '',
			expiryMonth: month,
			expiryYear: year,
			cvv: body.cvv ?? '',
			cardHolderName: body.cardHolderName ?? '',
			postalCode: body.postalCode,
			expiryDate: body.expiryDate,
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
