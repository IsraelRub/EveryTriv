import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';

import {
	API_ENDPOINTS,
	DEFAULT_USER_PREFERENCES,
	ERROR_CODES,
	GameMode,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { Cache, CurrentUserId, NoCache } from '../../common';
import { CreditsService } from './credits.service';
import { CanPlayDto, DeductCreditsDto, GetCreditHistoryDto } from './dtos';

@Controller(API_ENDPOINTS.CREDITS.BASE)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	@Get('balance')
	@NoCache()
	async getCreditBalance(@CurrentUserId() userId: string | null) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.creditsService.getCreditBalance(userId);

			logger.apiRead('credits_balance', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting credit balance', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	// Retrieves available credit packages
	@Get('packages')
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	async getCreditPackages() {
		try {
			const result = this.creditsService.getCreditPackages();

			logger.apiRead('credits_packages', {});

			return result;
		} catch (error) {
			logger.userError('Error getting credit packages', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('can-play')
	@Cache(TIME_DURATIONS_SECONDS.MINUTE)
	async canPlay(@CurrentUserId() userId: string | null, @Query() query: CanPlayDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const questionsPerRequest = query.questionsPerRequest ?? DEFAULT_USER_PREFERENCES.game.maxQuestionsPerGame;

			if (!questionsPerRequest || questionsPerRequest <= 0) {
				throw new HttpException(ERROR_CODES.VALID_QUESTIONS_PER_REQUEST_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const gameMode = query.gameMode ?? GameMode.QUESTION_LIMITED;
			const result = await this.creditsService.canPlay(userId, questionsPerRequest, gameMode);

			logger.apiRead('credits_can_play', {
				userId,
				questionsPerRequest,
				canPlay: result.canPlay,
				gameMode,
			});

			return result;
		} catch (error) {
			logger.userError('Error checking can play', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				questionsPerRequest: query.questionsPerRequest,
			});
			throw error;
		}
	}

	@Post('deduct')
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				questionsPerRequest: body.questionsPerRequest,
				gameMode: body.gameMode,
				reason: body.reason,
			});
			throw error;
		}
	}

	@Get('history')
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
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

			logger.apiRead('credits_history', {
				userId,
				limit,
				transactionsCount: result.length,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting credit history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				limit: query.limit,
			});
			throw error;
		}
	}
}
