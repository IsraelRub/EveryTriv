import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UsePipes } from '@nestjs/common';

import { CACHE_DURATION, UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { GameData, TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUser, CurrentUserId, NoCache, Roles } from '../../common';
import { CustomDifficultyPipe, GameAnswerPipe, LanguageValidationPipe, TriviaRequestPipe } from '../../common/pipes';
import { ValidateCustomDifficultyDto } from './dtos/customDifficulty.dto';
import { ValidateLanguageDto } from './dtos/languageValidation.dto';
import { SubmitAnswerDto } from './dtos/submitAnswer.dto';
import { TriviaRequestDto } from './dtos/triviaRequest.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
	constructor(private readonly gameService: GameService) {}

	/**
	 * Get trivia question by ID
	 */
	@Get('trivia/:id')
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getQuestionById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException('Question ID is required', HttpStatus.BAD_REQUEST);
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
	 * Get game by ID (for client compatibility)
	 */
	@Get(':id')
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getGameById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException('Game ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.getQuestionById(id);

			logger.apiRead('game_by_id', {
				id,
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

	/**
	 * Submit answer
	 */
	@Post('answer')
	@UsePipes(GameAnswerPipe)
	async submitAnswer(@CurrentUserId() userId: string, @Body() body: SubmitAnswerDto) {
		try {
			if (!body.questionId || !body.answer) {
				throw new HttpException('Question ID and answer are required', HttpStatus.BAD_REQUEST);
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
	 * Get trivia questions
	 */
	@Post('trivia')
	@NoCache()
	@UsePipes(TriviaRequestPipe)
	async getTriviaQuestions(@CurrentUserId() userId: string, @Body() body: TriviaRequestDto) {
		try {
			if (!body.topic || !body.difficulty || !body.questionCount) {
				throw new HttpException('Topic, difficulty, and question count are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.getTriviaQuestion(body.topic, body.difficulty, body.questionCount, userId);

			logger.apiCreate('game_trivia_questions', {
				userId,
				topic: body.topic,
				difficulty: body.difficulty,
				questionCount: body.questionCount,
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
	 * Get game history
	 */
	@Get('history')
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getGameHistory(@CurrentUserId() userId: string) {
		const startTime = Date.now();

		try {
			const result = await this.gameService.getUserGameHistory(userId);

			// Log API call for game history request
			logger.apiRead('game_history', {
				userId: userId,
				totalGames: result.totalGames,
				duration: Date.now() - startTime,
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
	 * Save game history
	 */
	@Post('history')
	async saveGameHistory(@CurrentUserId() userId: string, @Body() body: GameData) {
		try {
			// Validate required fields
			if (!body.userId || !body.score) {
				throw new HttpException('User ID and score are required', HttpStatus.BAD_REQUEST);
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
	 */
	@Delete('history/:gameId')
	async deleteGameHistory(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new HttpException('Game ID is required', HttpStatus.BAD_REQUEST);
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
	 */
	@Post('validate-custom')
	@UsePipes(CustomDifficultyPipe)
	async validateCustomDifficulty(@Body() body: ValidateCustomDifficultyDto) {
		try {
			if (!body.customText) {
				throw new HttpException('Custom text is required', HttpStatus.BAD_REQUEST);
			}

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
	 * Validate text with language tool
	 */
	@Post('validate-language')
	@UsePipes(LanguageValidationPipe)
	async validateLanguage(@Body() body: ValidateLanguageDto) {
		try {
			if (!body.text) {
				throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
			}

			// The LanguageValidationPipe handles all validation logic
			// This method simply returns the result from the pipe
			logger.apiUpdate('game_validate_language', {
				textLength: body.text.length,
				enableSpellCheck: body.enableSpellCheck,
				enableGrammarCheck: body.enableGrammarCheck,
			});
			return body;
		} catch (error) {
			logger.gameError('Error validating language', {
				error: getErrorMessage(error),
				textLength: body.text?.length,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get game statistics (admin only)
	 */
	@Get('admin/statistics')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
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
				cleared: true,
				deletedCount: result.deletedCount,
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
}
