import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import {
	API_ENDPOINTS,
	DEFAULT_LANGUAGE,
	ErrorCode,
	SURPRISE_SCOPE_DEFAULT,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import type { GameData } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';

import { Cache, CurrentUserId, NoCache } from '@common/decorators';
import { CustomDifficultyPipe, StartGameSessionPipe, TriviaRequestPipe } from '@common/pipes';
import { LanguageToolService } from '@common/validation';
import { serverLogger as logger } from '@internal/services';

import {
	FinalizeGameSessionDto,
	GameHistoryQueryDto,
	SaveGameHistoryDto,
	StartGameSessionDto,
	SubmitAnswerToSessionDto,
	SurprisePickQueryDto,
	TriviaRequestDto,
	ValidateCustomDifficultyDto,
	ValidateTextDto,
	ValidateTriviaTopicDto,
} from './dtos';
import { GameService } from './game.service';

@Controller(API_ENDPOINTS.GAME.BASE)
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly languageToolService: LanguageToolService
	) {}

	@Get('trivia/:id')
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	async getQuestionById(@Param('id') id: string) {
		try {
			const result = await this.gameService.getQuestionById(id);

			logger.apiRead('game_question_by_id', {
				questionId: id,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting question by ID', {
				errorInfo: { message: getErrorMessage(error) },
				questionId: id,
			});
			throw error;
		}
	}

	@Post('session/start')
	@NoCache()
	async startGameSession(@CurrentUserId() userId: string, @Body(StartGameSessionPipe) body: StartGameSessionDto) {
		try {
			const result = await this.gameService.startGameSession(
				userId,
				body.gameId,
				body.topic,
				body.difficulty,
				body.gameMode
			);

			logger.apiCreate('game_session_start', {
				userId,
				gameId: body.gameId,
				topic: body.topic,
				difficulty: body.difficulty,
				gameMode: body.gameMode,
			});

			return result;
		} catch (error) {
			logger.gameError('Error starting game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId: body.gameId,
			});
			throw error;
		}
	}

	@Post('session/answer')
	async submitAnswerToSession(@CurrentUserId() userId: string, @Body() body: SubmitAnswerToSessionDto) {
		try {
			const result = await this.gameService.submitAnswerToSession({
				questionId: body.questionId,
				answer: body.answer,
				userId,
				timeSpent: body.timeSpent,
				gameId: body.gameId,
			});

			logger.apiUpdate('game_session_answer_submit', {
				userId,
				gameId: body.gameId,
				questionId: body.questionId,
				timeSpent: body.timeSpent,
			});

			return result;
		} catch (error) {
			logger.gameError('Error submitting answer to session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId: body.gameId,
				questionId: body.questionId,
			});
			throw error;
		}
	}

	@Get('surprise-pick')
	@NoCache()
	async getSurprisePick(@CurrentUserId() userId: string, @Query() query: SurprisePickQueryDto) {
		try {
			const scopeValue = query.scope ?? SURPRISE_SCOPE_DEFAULT;
			const localeValue = query.locale ?? DEFAULT_LANGUAGE;
			const result = await this.gameService.getSurprisePick(userId, scopeValue, localeValue);
			logger.apiRead('game_surprise_pick', {
				...(result.topic !== undefined && { topic: result.topic }),
				...(result.difficulty !== undefined && { difficulty: result.difficulty }),
			});
			return result;
		} catch (error) {
			logger.gameError('Error getting surprise pick', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get('validate-session/:gameId')
	@NoCache()
	async validateSession(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		try {
			const result = await this.gameService.validateGameSession(userId, gameId);

			logger.apiRead('game_session_validate', {
				userId,
				gameId,
				isValid: result.isValid,
			});

			return result;
		} catch (error) {
			logger.gameError('Error validating game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId,
			});
			throw error;
		}
	}

	@Post('session/finalize')
	async finalizeGameSession(@CurrentUserId() userId: string, @Body() body: FinalizeGameSessionDto) {
		try {
			const result = await this.gameService.finalizeGameSession(userId, body.gameId);

			logger.apiUpdate('game_session_finalize', {
				userId,
				gameId: body.gameId,
				score: result.score,
			});

			return result;
		} catch (error) {
			logger.gameError('Error finalizing game session', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				gameId: body.gameId,
			});
			throw error;
		}
	}

	@Post('trivia')
	@NoCache()
	async getTriviaQuestions(@CurrentUserId() userId: string, @Body(TriviaRequestPipe) body: TriviaRequestDto) {
		try {
			const result = await this.gameService.getTriviaQuestion({
				topic: body.topic,
				difficulty: body.difficulty,
				questionsPerRequest: body.questionsPerRequest,
				userId,
				answerCount: body.answerCount,
				gameId: body.gameId,
				outputLanguage: body.outputLanguage,
			});

			logger.apiCreate('game_trivia_questions', {
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
				questionsPerRequest: body.questionsPerRequest,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
			});
			throw error;
		}
	}

	@Get('history')
	async getGameHistory(@CurrentUserId() userId: string, @Query() query: GameHistoryQueryDto) {
		const startTime = Date.now();

		try {
			const result = await this.gameService.getUserGameHistory({
				userId,
				limit: query.limit,
				offset: query.offset,
			});

			const games = result?.games ?? [];
			const historySummary = games.slice(0, 10).map(g => ({
				topic: g.topic,
				difficulty: g.difficulty,
				score: g.score,
				correctAnswers: g.correctAnswers,
			}));
			logger.apiRead('game_history', {
				userId: userId,
				totalGames: result.totalGames,
				limit: query.limit,
				offset: query.offset,
				duration: calculateDuration(startTime),
				chart: 'game_history',
				returnedCount: games.length,
				recentGames: historySummary,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});

			throw error;
		}
	}

	@Post('history')
	async saveGameHistory(@CurrentUserId() userId: string, @Body() body: SaveGameHistoryDto) {
		try {
			if (!body.score) {
				throw new HttpException(ErrorCode.SCORE_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			// Convert DTO to GameData format
			const gameData: GameData = {
				userId,
				score: body.score,
				gameQuestionCount: body.gameQuestionCount,
				correctAnswers: body.correctAnswers,
				difficulty: body.difficulty,
				topic: body.topic,
				gameMode: body.gameMode,
				timeSpent: body.timeSpent,
				creditsUsed: body.creditsUsed,
				answerHistory: body.answerHistory,
				clientMutationId: body.clientMutationId,
			};

			const result = await this.gameService.saveGameHistory({
				userId,
				gameData,
			});

			logger.apiCreate('game_history_save', {
				userId,
				score: body.score,
			});

			return result;
		} catch (error) {
			logger.gameError('Error saving game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				score: body.score,
			});
			throw error;
		}
	}

	@Delete('history/:gameId')
	async deleteGameHistory(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		try {
			const result = await this.gameService.deleteGameHistory({
				userId,
				gameId,
			});

			logger.apiDelete('game_history_delete', {
				userId,
				id: gameId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error deleting game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				id: gameId,
			});
			throw error;
		}
	}

	@Delete('history')
	async clearGameHistory(@CurrentUserId() userId: string) {
		try {
			const result = await this.gameService.clearUserGameHistory(userId);

			logger.apiDelete('game_history_clear_all', {
				userId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error clearing game history', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	@Post('validate-custom')
	async validateCustomDifficulty(@Body(CustomDifficultyPipe) body: ValidateCustomDifficultyDto) {
		try {
			logger.apiUpdate('game_validate_custom_difficulty', {
				textLength: body.customText.length,
			});

			return body;
		} catch (error) {
			logger.gameError('Error validating custom difficulty', {
				errorInfo: { message: getErrorMessage(error) },
				textLength: body.customText?.length,
			});
			throw error;
		}
	}

	@Post('validate-trivia-topic')
	@NoCache()
	async validateTriviaTopic(@CurrentUserId() userId: string, @Body() body: ValidateTriviaTopicDto) {
		try {
			const result = await this.gameService.validateTriviaTopicForClient({
				topic: body.topic,
				difficulty: body.difficulty,
				outputLanguage: body.outputLanguage,
			});

			logger.apiCreate('game_validate_trivia_topic', {
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
			});

			return result;
		} catch (error) {
			logger.gameError('Error validating trivia topic', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
			});
			throw error;
		}
	}

	@Post('validate-text')
	@NoCache()
	async validateText(@Body() body: ValidateTextDto) {
		try {
			const trimmed = body.text.trim();
			const result =
				body.language != null
					? await this.languageToolService.checkGameNaturalText(trimmed, { outputLanguage: body.language })
					: await this.languageToolService.checkGameNaturalText(trimmed, { detectLanguage: true });
			return result;
		} catch (error) {
			logger.gameError('Error validating text', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	@Get(':id')
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getGameById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(ErrorCode.GAME_ID_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			// Normalize ID (remove trailing slashes)
			const normalizedId = id.trim().replace(/\/+$/, '');

			// Prevent matching reserved route names
			const reservedRoutesSet = new Set<string>([
				'trivia',
				'history',
				'admin',
				'validate-custom',
				'validate-text',
				'validate-trivia-topic',
				'session',
				'surprise-pick',
			]);
			if (reservedRoutesSet.has(normalizedId.toLowerCase())) {
				throw new HttpException(
					`${ErrorCode.INVALID_GAME_ID_FORMAT}. '${normalizedId}' is a reserved route name.`,
					HttpStatus.BAD_REQUEST
				);
			}

			const result = await this.gameService.getGameById(normalizedId);

			logger.apiRead('game_by_id', {
				id: normalizedId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting game by ID', {
				errorInfo: { message: getErrorMessage(error) },
				id,
			});

			throw error;
		}
	}
}
