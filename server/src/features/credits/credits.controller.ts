import { Body, Controller, ForbiddenException, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';

import {
	API_ENDPOINTS,
	DEFAULT_USER_PREFERENCES,
	ErrorCode,
	GameMode,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUserId, NoCache } from '@common/decorators';
import { serverLogger as logger } from '@internal/services';

import { CreditsService } from './credits.service';
import { CanPlayDto, DeductCreditsDto } from './dtos';

@Controller(API_ENDPOINTS.CREDITS.BASE)
export class CreditsController {
	constructor(private readonly creditsService: CreditsService) {}

	@Get('balance')
	@NoCache()
	async getCreditBalance(@CurrentUserId() userId: string | null) {
		if (!userId) {
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
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
			const result = await this.creditsService.getCreditPackages();

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
	@NoCache()
	async canPlay(@CurrentUserId() userId: string | null, @Query() query: CanPlayDto) {
		if (!userId) {
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
		}
		try {
			const questionsPerRequest = query.questionsPerRequest ?? DEFAULT_USER_PREFERENCES.game.maxQuestionsPerGame;

			if (!questionsPerRequest || questionsPerRequest <= 0) {
				throw new HttpException(ErrorCode.VALID_QUESTIONS_PER_REQUEST_REQUIRED, HttpStatus.BAD_REQUEST);
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
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
		}
		try {
			logger.apiDebug('Deduct credits request received', {
				userId,
				questionsPerRequest: body.questionsPerRequest,
				gameMode: body.gameMode,
				reason: body.reason,
			});

			const questionsPerRequest = body.questionsPerRequest ?? questionsPerRequestParam;
			if (!questionsPerRequest || questionsPerRequest <= 0) {
				logger.userError('Invalid questions per request in request', {
					userId,
					questionsPerRequest: body.questionsPerRequest,
					gameMode: body.gameMode,
					reason: body.reason,
				});
				throw new HttpException(ErrorCode.QUESTIONS_PER_REQUEST_REQUIRED, HttpStatus.BAD_REQUEST);
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
}
