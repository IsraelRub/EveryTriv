import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';

import {
	API_ROUTES,
	CACHE_DURATION,
	DEFAULT_USER_PREFERENCES,
	ERROR_CODES,
	GameMode,
	PaymentMethod,
} from '@shared/constants';
import type { ManualPaymentDetails } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { Cache, CurrentUserId, NoCache } from '../../common';
import { CreditsService } from './credits.service';
import {
	CanPlayDto,
	ConfirmCreditPurchaseDto,
	DeductCreditsDto,
	GetCreditHistoryDto,
	PurchaseCreditsDto,
} from './dtos';

@Controller(API_ROUTES.CREDITS.BASE)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	/**
	 * Get user credit balance
	 * @param userId Current user identifier
	 * @returns User credit balance
	 */
	@Get(API_ROUTES.CREDITS.BALANCE)
	@NoCache()
	async getCreditBalance(@CurrentUserId() userId: string | null) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.creditsService.getCreditBalance(userId);

			// Log API call for balance check
			logger.apiRead('credits_balance', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting credit balance', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get available credit packages
	 * @returns Available credit packages
	 */
	@Get(API_ROUTES.CREDITS.PACKAGES)
	@Cache(CACHE_DURATION.VERY_LONG) // Cache for 1 hour - credit packages rarely change
	async getCreditPackages() {
		try {
			const result = this.creditsService.getCreditPackages();

			// Log API call for packages request
			logger.apiRead('credits_packages', {});

			return result;
		} catch (error) {
			logger.userError('Error getting credit packages', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Check if user can play with given question count
	 * @param userId Current user identifier
	 * @param query Can play query parameters
	 * @returns Can play result
	 */
	@Get(API_ROUTES.CREDITS.CAN_PLAY)
	@Cache(CACHE_DURATION.SHORT) // Cache for 1 minute
	async canPlay(@CurrentUserId() userId: string | null, @Query() query: CanPlayDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const questionsPerRequest = query.questionsPerRequest ?? DEFAULT_USER_PREFERENCES.game?.maxQuestionsPerGame ?? 5;

			if (!questionsPerRequest || questionsPerRequest <= 0) {
				throw new HttpException(ERROR_CODES.VALID_QUESTIONS_PER_REQUEST_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const gameMode = query.gameMode ?? GameMode.QUESTION_LIMITED;
			const result = await this.creditsService.canPlay(userId, questionsPerRequest, gameMode);

			// Log API call for can-play check
			logger.apiRead('credits_can_play', {
				userId,
				questionsPerRequest,
				canPlay: result.canPlay,
				gameMode,
			});

			return result;
		} catch (error) {
			logger.userError('Error checking can play', {
				error: getErrorMessage(error),
				userId,
				questionsPerRequest: query.questionsPerRequest,
			});
			throw error;
		}
	}

	/**
	 * Deduct credits from user
	 * @param userId Current user identifier
	 * @param body Credits deduction data
	 * @returns Credits deduction result
	 */
	@Post(API_ROUTES.CREDITS.DEDUCT)
	async deductCredits(
		@CurrentUserId() userId: string | null,
		@Body() body: DeductCreditsDto,
		@Query('questionsPerRequest') questionsPerRequestParam?: number,
		@Query('gameMode') gameModeParam?: GameMode
	) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			logger.apiDebug('Deduct credits request received', {
				userId,
				questionsPerRequest: body.questionsPerRequest,
				gameMode: body.gameMode,
				data: {
					body,
				},
			});

			const questionsPerRequest = body.questionsPerRequest ?? questionsPerRequestParam;
			if (!questionsPerRequest || questionsPerRequest <= 0) {
				logger.userError('Invalid questions per request in request', {
					userId,
					questionsPerRequest: body.questionsPerRequest,
					gameMode: body.gameMode,
					data: {
						body,
					},
				});
				throw new HttpException(ERROR_CODES.QUESTIONS_PER_REQUEST_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const gameMode = body.gameMode ?? gameModeParam ?? GameMode.QUESTION_LIMITED;

			const result = await this.creditsService.deductCredits(userId, questionsPerRequest, gameMode, body.reason);

			// Log API call for credits deduction with IP and User Agent
			logger.apiUpdate('credits_deduct', {
				userId,
				questionsPerRequest,
				gameMode,
				reason: body.reason,
				remainingCredits: result.totalCredits,
			});

			return result;
		} catch (error) {
			logger.userError('Error deducting credits', {
				error: getErrorMessage(error),
				userId,
				questionsPerRequest: body.questionsPerRequest,
				gameMode: body.gameMode,
				reason: body.reason,
			});
			throw error;
		}
	}

	/**
	 * Get user credit transaction history
	 * @param userId Current user identifier
	 * @param query Credit history query parameters
	 * @returns Credit transaction history
	 */
	@Get(API_ROUTES.CREDITS.HISTORY)
	@Cache(CACHE_DURATION.SHORT + 90) // Cache for 2 minutes
	async getCreditHistory(@CurrentUserId() userId: string | null, @Query() query: GetCreditHistoryDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const limit = query.limit;
			if (limit > 100) {
				throw new HttpException(ERROR_CODES.LIMIT_CANNOT_EXCEED_100, HttpStatus.BAD_REQUEST);
			}

			const result = await this.creditsService.getCreditHistory(userId, limit);

			// Log API call for credits history request
			logger.apiRead('credits_history', {
				userId,
				limit,
				transactionsCount: result.length,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting credit history', {
				error: getErrorMessage(error),
				userId,
				limit: query.limit,
			});
			throw error;
		}
	}

	/**
	 * Purchase credits package
	 * @param userId Current user identifier
	 * @param body Credits purchase data
	 * @returns Credits purchase result
	 */
	@Post(API_ROUTES.CREDITS.PURCHASE)
	async purchaseCredits(@CurrentUserId() userId: string | null, @Body() body: PurchaseCreditsDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			if (!body.packageId) {
				throw new HttpException(ERROR_CODES.PACKAGE_ID_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const manualPayment =
				body.paymentMethod === PaymentMethod.MANUAL_CREDIT ? this.buildManualPaymentDetails(body) : undefined;
			const result = await this.creditsService.purchaseCredits(userId, {
				packageId: body.packageId,
				paymentMethod: body.paymentMethod,
				paypalOrderId: body.paypalOrderId,
				paypalPaymentId: body.paypalPaymentId,
				manualPayment,
			});

			// Log API call for credits purchase
			logger.apiCreate('credits_purchase', {
				userId,
				id: body.packageId,
			});

			return result;
		} catch (error) {
			logger.userError('Error purchasing credits', {
				error: getErrorMessage(error),
				userId,
				id: body.packageId,
			});
			throw error;
		}
	}

	/**
	 * Confirm credit purchase
	 * @param userId Current user identifier
	 * @param body Credit purchase confirmation data
	 * @returns Purchase confirmation result
	 */
	@Post(API_ROUTES.CREDITS.CONFIRM_PURCHASE)
	async confirmCreditPurchase(@CurrentUserId() userId: string | null, @Body() body: ConfirmCreditPurchaseDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const paymentIdentifier = body.paymentIntentId ?? body.transactionId ?? body.paymentId;
			if (!paymentIdentifier || !body.credits || body.credits <= 0) {
				throw new HttpException(ERROR_CODES.PAYMENT_INTENT_ID_AND_CREDITS_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = this.creditsService.confirmCreditPurchase(userId, paymentIdentifier, body.credits);

			// Log API call for purchase confirmation
			logger.apiUpdate('credits_purchase_confirm', {
				userId,
				id: paymentIdentifier,
				credits: body.credits,
			});

			return result;
		} catch (error) {
			logger.userError('Error confirming credit purchase', {
				error: getErrorMessage(error),
				userId,
				id: body.paymentIntentId ?? body.transactionId ?? body.paymentId,
			});
			throw error;
		}
	}

	private buildManualPaymentDetails(body: PurchaseCreditsDto): ManualPaymentDetails {
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
