import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';

import { API_ROUTES, CACHE_DURATION, ERROR_CODES, UserRole } from '@shared/constants';
import type { GameData } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import type { TokenPayload } from '@internal/types';
import { Cache, CurrentUser, CurrentUserId, NoCache, Roles } from '../../common';
import { CustomDifficultyPipe, GameAnswerPipe, TriviaRequestPipe } from '../../common/pipes';
import { GameHistoryQueryDto, SubmitAnswerDto, TriviaRequestDto, ValidateCustomDifficultyDto } from './dtos';
import { GameService } from './game.service';

@Controller(API_ROUTES.GAME.BASE)
export class GameController {
	constructor(private readonly gameService: GameService) {}

	/**
	 * Get trivia question by ID
	 * @param id Question identifier
	 * @returns Trivia question details
	 */
	@Get('trivia/:id')
	@Cache(CACHE_DURATION.MEDIUM)
	async getQuestionById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(ERROR_CODES.QUESTION_ID_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.getQuestionById(id);

			logger.apiRead('game_question_by_id', {
				questionId: id,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting question by ID', {
				error: getErrorMessage(error),
				questionId: id,
			});
			throw error;
		}
	}

	/**
	 * Submit answer to a trivia question
	 * @param userId Current user identifier
	 * @param body Answer submission data
	 * @returns Answer result with correctness and scoring
	 */
	@Post('answer')
	async submitAnswer(@CurrentUserId() userId: string, @Body(GameAnswerPipe) body: SubmitAnswerDto) {
		try {
			if (!body.questionId || !body.answer) {
				throw new HttpException(ERROR_CODES.QUESTION_ID_AND_ANSWER_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.submitAnswer(body.questionId, body.answer, userId, body.timeSpent);

			logger.apiUpdate('game_answer_submit', {
				userId,
				questionId: body.questionId,
				timeSpent: body.timeSpent,
			});

			return result;
		} catch (error) {
			logger.gameError('Error submitting answer', {
				error: getErrorMessage(error),
				userId,
				questionId: body.questionId,
			});
			throw error;
		}
	}

	/**
	 * Get trivia questions based on topic and difficulty
	 * @param userId Current user identifier
	 * @param body Trivia request parameters
	 * @returns Generated trivia questions
	 */
	@Post('trivia')
	@NoCache()
	async getTriviaQuestions(@CurrentUserId() userId: string, @Body(TriviaRequestPipe) body: TriviaRequestDto) {
		try {
			const result = await this.gameService.getTriviaQuestion(
				body.topic,
				body.difficulty,
				body.questionsPerRequest,
				userId,
				body.answerCount
			);

			logger.apiCreate('game_trivia_questions', {
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
				questionsPerRequest: body.questionsPerRequest,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting trivia questions', {
				error: getErrorMessage(error),
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
			});
			throw error;
		}
	}

	/**
	 * Get user's game history
	 * @param userId Current user identifier
	 * @param query Query parameters for pagination
	 * @returns User's game history with statistics
	 */
	@Get('history')
	@Cache(CACHE_DURATION.LONG, 'game_history')
	async getGameHistory(@CurrentUserId() userId: string, @Query() query: GameHistoryQueryDto) {
		const startTime = Date.now();

		try {
			const limit = query.limit ?? 20;
			const offset = query.offset ?? 0;
			const result = await this.gameService.getUserGameHistory(userId, limit, offset);

			// Log API call for game history request
			logger.apiRead('game_history', {
				userId: userId,
				totalGames: result.totalGames,
				limit,
				offset,
				duration: calculateDuration(startTime),
			});

			// Return only the data - ResponseFormattingInterceptor will handle the response structure
			return result;
		} catch (error) {
			logger.gameError('Error getting game history', {
				error: getErrorMessage(error),
				userId,
			});

			throw error;
		}
	}

	/**
	 * Save game history entry
	 * @param userId Current user identifier
	 * @param body Game data to save
	 * @returns Saved game history entry
	 */
	@Post('history')
	async saveGameHistory(@CurrentUserId() userId: string, @Body() body: GameData) {
		try {
			// Validate required fields
			if (!body.score) {
				throw new HttpException(ERROR_CODES.SCORE_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.saveGameHistory(userId, body);

			// Log API call for game history save
			logger.apiCreate('game_history_save', {
				userId,
				score: body.score,
			});

			return result;
		} catch (error) {
			logger.gameError('Error saving game history', {
				error: getErrorMessage(error),
				userId,
				score: body.score,
			});
			throw error;
		}
	}

	/**
	 * Delete specific game from history
	 * @param userId Current user identifier
	 * @param gameId Game identifier to delete
	 * @returns Deletion result
	 */
	@Delete('history/:gameId')
	async deleteGameHistory(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new HttpException(ERROR_CODES.GAME_ID_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.deleteGameHistory(userId, gameId);

			// Log API call for game history deletion
			logger.apiDelete('game_history_delete', {
				userId,
				id: gameId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error deleting game history', {
				error: getErrorMessage(error),
				userId,
				id: gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all game history for user
	 * @param userId Current user identifier
	 * @returns Clear operation result
	 */
	@Delete('history')
	async clearGameHistory(@CurrentUserId() userId: string) {
		try {
			const result = await this.gameService.clearUserGameHistory(userId);

			// Log API call for clearing game history
			logger.apiDelete('game_history_clear_all', {
				userId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error clearing game history', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Validate custom difficulty text
	 * @param body Custom difficulty validation data
	 * @returns Validated custom difficulty data
	 */
	@Post('validate-custom')
	async validateCustomDifficulty(@Body(CustomDifficultyPipe) body: ValidateCustomDifficultyDto) {
		try {
			// The CustomDifficultyPipe handles all validation logic
			// This method simply returns the result from the pipe
			logger.apiUpdate('game_validate_custom_difficulty', {
				textLength: body.customText.length,
			});

			return body;
		} catch (error) {
			logger.gameError('Error validating custom difficulty', {
				error: getErrorMessage(error),
				textLength: body.customText?.length,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get game statistics (admin only)
	 * @param user Current admin user token payload
	 * @returns Game statistics summary
	 */
	@Get('admin/statistics')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
	async getGameStatistics(@CurrentUser() user: TokenPayload) {
		try {
			const statistics = await this.gameService.getAdminStatistics();

			logger.apiRead('game_admin_statistics', {
				id: user.sub,
				role: user.role,
				totalGames: statistics.totalGames,
			});

			return statistics;
		} catch (error) {
			logger.gameError('Failed to get game statistics', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all game history (admin only)
	 * @param user Current admin user token payload
	 * @returns Clear operation result with deleted count
	 */
	@Delete('admin/history/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllGameHistory(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.gameService.clearAllGameHistory();

			logger.apiDelete('game_admin_clear_all_history', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				cleared: (result.deletedCount ?? 0) > 0,
				deletedCount: result.deletedCount ?? 0,
				message: result.message,
			};
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get all trivia questions (admin only)
	 * @param user Current admin user token payload
	 * @returns All trivia questions from database
	 */
	@Get('admin/trivia')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM)
	async getAllTriviaQuestions(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.gameService.getAllTriviaQuestions();

			logger.apiRead('game_admin_get_all_trivia', {
				id: user.sub,
				role: user.role,
			});

			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all trivia questions (admin only)
	 * @param user Current admin user token payload
	 * @returns Clear operation result with deleted count
	 */
	@Delete('admin/trivia/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllTrivia(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.gameService.clearAllTrivia();

			logger.apiDelete('game_admin_clear_all_trivia', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				cleared: (result.deletedCount ?? 0) > 0,
				deletedCount: result.deletedCount ?? 0,
				message: result.message,
			};
		} catch (error) {
			logger.gameError('Failed to clear all trivia', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	/**
	 * Get game by ID (for client compatibility)
	 * Must be last to avoid conflicts with specific routes like 'trivia/:id'
	 * @param id Game identifier
	 * @returns Game details
	 */
	@Get(':id')
	@Cache(CACHE_DURATION.MEDIUM)
	async getGameById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(ERROR_CODES.GAME_ID_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			// Normalize ID (remove trailing slashes)
			const normalizedId = id.trim().replace(/\/+$/, '');

			// Prevent matching reserved route names
			const reservedRoutes = ['trivia', 'history', 'admin', 'answer', 'validate-custom'];
			if (reservedRoutes.includes(normalizedId.toLowerCase())) {
				throw new HttpException(
					`${ERROR_CODES.INVALID_GAME_ID_FORMAT}. '${normalizedId}' is a reserved route name.`,
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
				error: getErrorMessage(error),
				id,
			});

			throw error;
		}
	}
}
