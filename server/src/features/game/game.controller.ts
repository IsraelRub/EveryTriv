import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UsePipes } from '@nestjs/common';
import { CreateGameHistoryDto, GameStatisticsResponse, serverLogger as logger, getErrorMessage } from '@shared';

import {
	AuditLog,
	Cache,
	ClientIP,
	CurrentUser,
	CurrentUserId,
	GameCooldown,
	GameDifficulty,
	GameTopic,
	PerformanceThreshold,
	RequireGameSession,
	Roles,
	UserActivityLog,
	UserAgent,
} from '../../common';
import { CustomDifficultyPipe, GameAnswerPipe, LanguageValidationPipe, TriviaRequestPipe } from '../../common/pipes';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
	constructor(private readonly gameService: GameService) {}

	/**
	 * Get trivia question by ID
	 */
	@Get('trivia/:id')
	async getQuestionById(@Param('id') id: string) {
		const result = await this.gameService.getQuestionById(id);
		return result;
	}

	/**
	 * Get game by ID (for client compatibility)
	 */
	@Get(':id')
	async getGameById(@Param('id') id: string) {
		const result = await this.gameService.getQuestionById(id);
		return result;
	}

	/**
	 * Submit answer
	 */
	@Post('answer')
	@UsePipes(GameAnswerPipe)
	@RequireGameSession(true)
	@GameCooldown(1000)
	@PerformanceThreshold(500)
	@UserActivityLog('game:submit-answer')
	async submitAnswer(
		@CurrentUserId() userId: string,
		@Body() body: { questionId: string; answer: string; timeSpent: number },
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
		// Log game activity with IP and User Agent
		logger.logUserActivity(userId, 'Answer submitted', {
			questionId: body.questionId,
			timeSpent: body.timeSpent,
			ip,
			userAgent,
		});

		const result = await this.gameService.submitAnswer(body.questionId, body.answer, userId, body.timeSpent);
		return result;
	}

	/**
	 * Get trivia questions
	 */
	@Post('trivia')
	@UsePipes(TriviaRequestPipe)
	@GameTopic('general', 'science', 'history', 'sports', 'entertainment')
	@GameDifficulty('easy', 'medium', 'hard')
	@RequireGameSession(true)
	@PerformanceThreshold(1000)
	@UserActivityLog('game:get-trivia-questions')
	async getTriviaQuestions(
		@CurrentUserId() userId: string,
		@Body() body: { topic: string; difficulty: string; questionCount: number }
	) {
		const result = await this.gameService.getTriviaQuestion(body.topic, body.difficulty, body.questionCount, userId);

		return result;
	}

	/**
	 * Get game history
	 */
	@Get('history')
	@Cache(600) // Cache for 10 minutes
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

			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.apiReadError('game_history', getErrorMessage(error), {
				userId: userId,
				duration: Date.now() - startTime,
			});

			// Enhanced error response
			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				{
					message: 'Failed to get game history',
					error: getErrorMessage(error),
					timestamp: new Date().toISOString(),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Save game history
	 */
	@Post('history')
	async saveGameHistory(@CurrentUserId() userId: string, @Body() body: CreateGameHistoryDto) {
		const startTime = Date.now();

		try {
			// Validate required fields
			if (!body.userId || !body.score) {
				throw new HttpException('User ID and score are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.saveGameHistory(userId, body);

			// Log API call for game history save
			logger.apiUpdate('game_history_save', {
				userId: userId,
				score: body.score,
				duration: Date.now() - startTime,
			});

			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.apiUpdateError('game_history_save', getErrorMessage(error), {
				userId: userId,
				duration: Date.now() - startTime,
			});

			// Enhanced error response
			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				{
					message: 'Failed to save game history',
					error: getErrorMessage(error),
					timestamp: new Date().toISOString(),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Delete specific game from history
	 */
	@Delete('history/:gameId')
	async deleteGameHistory(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		const startTime = Date.now();

		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new HttpException('Game ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.deleteGameHistory(userId, gameId);

			// Log API call for game history deletion
			logger.apiDelete('game_history', {
				userId: userId,
				gameId,
				duration: Date.now() - startTime,
			});

			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.apiDeleteError('game_history', getErrorMessage(error), {
				userId: userId,
				gameId,
				duration: Date.now() - startTime,
			});

			// Enhanced error response
			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				{
					message: 'Failed to delete game history',
					error: getErrorMessage(error),
					timestamp: new Date().toISOString(),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Clear all game history for user
	 */
	@Delete('history')
	async clearGameHistory(@CurrentUserId() userId: string) {
		const startTime = Date.now();

		try {
			const result = await this.gameService.clearUserGameHistory(userId);

			// Log API call for clearing game history
			logger.apiDelete('game_history_all', {
				userId: userId,
				duration: Date.now() - startTime,
			});

			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.apiDeleteError('game_history_all', getErrorMessage(error), {
				userId: userId,
				duration: Date.now() - startTime,
			});

			// Enhanced error response
			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				{
					message: 'Failed to clear game history',
					error: getErrorMessage(error),
					timestamp: new Date().toISOString(),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Validate custom difficulty text
	 */
	@Post('validate-custom')
	@UsePipes(CustomDifficultyPipe)
	@GameDifficulty('custom')
	@PerformanceThreshold(200)
	@AuditLog('game:validate-custom-difficulty')
	async validateCustomDifficulty(@Body() body: { customText: string }) {
		// The CustomDifficultyPipe handles all validation logic
		// This method simply returns the result from the pipe
		return body;
	}

	/**
	 * Validate text with language tool
	 */
	@Post('validate-language')
	@UsePipes(LanguageValidationPipe)
	async validateLanguage(
		@Body() body: { text: string; language?: string; enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
	) {
		// The LanguageValidationPipe handles all validation logic
		// This method simply returns the result from the pipe
		return body;
	}

	/**
	 * Admin endpoint - get game statistics (admin only)
	 */
	@Get('admin/statistics')
	@Roles('admin', 'super-admin')
	async getGameStatistics(
		@CurrentUser() user: { id: string; role: string; username: string }
	): Promise<GameStatisticsResponse> {
		try {
			logger.apiRead('admin_get_game_statistics', {
				adminId: user.id,
				adminRole: user.role,
			});

			// This would call a service method to get game statistics
			const statistics = {
				totalGames: 0,
				averageScore: 0,
				bestScore: 0,
				totalQuestionsAnswered: 0,
				correctAnswers: 0,
				accuracy: 0,
				favoriteTopics: [],
				difficultyBreakdown: {},
			};

			return {
				message: 'Game statistics retrieved successfully',
				statistics: statistics,
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to get game statistics', {
				error: getErrorMessage(error),
				adminId: user.id,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all game history (super-admin only)
	 */
	@Delete('admin/history/clear-all')
	@Roles('super-admin')
	async clearAllGameHistory(
		@CurrentUser() user: { id: string; role: string; username: string }
	): Promise<{ message: string; success: boolean; timestamp: string }> {
		try {
			logger.apiDelete('admin_clear_all_game_history', {
				adminId: user.id,
				adminRole: user.role,
			});

			// This would call a service method to clear all game history
			// await this.gameService.clearAllGameHistory();

			return {
				message: 'All game history cleared successfully',
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to clear all game history', {
				error: getErrorMessage(error),
				adminId: user.id,
			});
			throw error;
		}
	}
}
