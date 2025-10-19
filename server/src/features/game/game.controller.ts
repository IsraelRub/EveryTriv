import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, UsePipes } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { CreateGameHistoryDto, BasicUser } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { UserRole, CACHE_DURATION } from '@shared/constants';

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
				gameId: id,
			});

			return result;
		} catch (error) {
			logger.gameError('Error getting game by ID', {
				error: getErrorMessage(error),
				gameId: id,
			});
			throw error;
		}
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
		try {
			if (!body.questionId || !body.answer) {
				throw new HttpException('Question ID and answer are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.submitAnswer(body.questionId, body.answer, userId, body.timeSpent);

			logger.apiUpdate('game_answer_submit', {
				userId,
				questionId: body.questionId,
				timeSpent: body.timeSpent,
				ip,
				userAgent,
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
	@UserActivityLog('game:save-history')
	async saveGameHistory(@CurrentUserId() userId: string, @Body() body: CreateGameHistoryDto) {
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
	@UserActivityLog('game:delete-history')
	async deleteGameHistory(@CurrentUserId() userId: string, @Param('gameId') gameId: string) {
		try {
			if (!gameId || gameId.trim().length === 0) {
				throw new HttpException('Game ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.gameService.deleteGameHistory(userId, gameId);

			// Log API call for game history deletion
			logger.apiDelete('game_history_delete', {
				userId,
				gameId,
			});

			return result;
		} catch (error) {
			logger.gameError('Error deleting game history', {
				error: getErrorMessage(error),
				userId,
				gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all game history for user
	 */
	@Delete('history')
	@UserActivityLog('game:clear-all-history')
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
	@GameDifficulty('custom')
	@PerformanceThreshold(200)
	@AuditLog('game:validate-custom-difficulty')
	async validateCustomDifficulty(@Body() body: { customText: string }) {
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
	async validateLanguage(
		@Body() body: { text: string; language?: string; enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
	) {
		try {
			if (!body.text) {
				throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
			}

			// The LanguageValidationPipe handles all validation logic
			// This method simply returns the result from the pipe
			logger.apiUpdate('game_validate_language', {
				textLength: body.text.length,
				language: body.language,
				spellCheck: body.enableSpellCheck,
				grammarCheck: body.enableGrammarCheck,
			});

			return body;
		} catch (error) {
			logger.gameError('Error validating language', {
				error: getErrorMessage(error),
				textLength: body.text?.length,
				language: body.language,
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
	async getGameStatistics(@CurrentUser() user: BasicUser) {
		try {
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

			logger.apiRead('game_admin_statistics', {
				adminId: user.id,
				adminRole: user.role,
				totalGames: statistics.totalGames,
			});

			return statistics;
		} catch (error) {
			logger.gameError('Failed to get game statistics', {
				error: getErrorMessage(error),
				adminId: user.id,
				adminRole: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - delete all game history (admin only)
	 */
	@Delete('admin/history/clear-all')
	@Roles(UserRole.ADMIN)
	@AuditLog('admin:clear-all-game-history')
	async clearAllGameHistory(@CurrentUser() user: BasicUser) {
		try {
			// This would call a service method to clear all game history
			// await this.gameService.clearAllGameHistory();

			logger.apiDelete('game_admin_clear_all_history', {
				adminId: user.id,
				adminRole: user.role,
			});

			return { cleared: true };
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				error: getErrorMessage(error),
				adminId: user.id,
				adminRole: user.role,
			});
			throw error;
		}
	}
}
