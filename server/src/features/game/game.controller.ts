import { Body, Controller, Get, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthRequest } from 'everytriv-shared/types';
import type { LanguageValidationOptions } from 'everytriv-shared/types/language.types';

import { ServerLogger } from '../../../../shared/services/logging';
import { ValidationService } from '../../common/validation/validation.service';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
	constructor(
		private readonly gameService: GameService,
		private readonly validationService: ValidationService,
		private readonly logger: ServerLogger
	) {}

	/**
	 * Get trivia question
	 */
	@Get('trivia/:id')
	async getQuestionById(@Body() params: { id: string }) {
		try {
			return await this.gameService.getQuestionById(params.id);
		} catch (error) {
			this.logger.gameError('Error getting question by ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				questionId: params.id,
			});
			throw error;
		}
	}

	/**
	 * Submit answer
	 */
	@Post('answer')
	async submitAnswer(@Req() req: AuthRequest, @Body() body: { questionId: string; answer: string; timeSpent: number }) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			// Validate answer content
			const answerValidation = await this.validationService.validateInputContent(body.answer);
			if (!answerValidation.isValid) {
				throw new HttpException(
					{
						message: 'Invalid answer',
						errors: answerValidation.errors,
					},
					HttpStatus.BAD_REQUEST
				);
			}

			const result = await this.gameService.submitAnswer(body.questionId, body.answer, req.user.id, body.timeSpent);

			// Log API call for answer submission
			this.logger.apiUpdate('answer', {
				userId: req.user.id,
				questionId: body.questionId,
				isCorrect: result.isCorrect,
				points: result.points,
			});

			return result;
		} catch (error) {
			this.logger.apiUpdateError('answer', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				questionId: body.questionId,
			});
			throw error;
		}
	}

	/**
	 * Get user analytics
	 */
	@Get('analytics')
	async getUserAnalytics(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			return await this.gameService.getUserAnalytics(req.user.id);
		} catch (error) {
			this.logger.gameError('Error getting user analytics', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get trivia questions
	 */
	@Post('trivia')
	async getTriviaQuestions(
		@Req() req: AuthRequest,
		@Body() body: { topic: string; difficulty: string; questionCount: number }
	) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			// Validate trivia request using service
			const triviaValidation = await this.validationService.validateTriviaRequest(
				body.topic,
				body.difficulty,
				body.questionCount
			);

			if (!triviaValidation.isValid) {
				throw new HttpException(
					{
						message: 'Invalid trivia request',
						errors: triviaValidation.errors,
					},
					HttpStatus.BAD_REQUEST
				);
			}

			const result = await this.gameService.getTriviaQuestion(
				body.topic,
				body.difficulty,
				body.questionCount,
				req.user.id
			);

			// Log API call for trivia questions request
			this.logger.apiRead('trivia_questions', {
				userId: req.user.id,
				topic: body.topic,
				difficulty: body.difficulty,
				questionCount: body.questionCount,
			});

			return result;
		} catch (error) {
			this.logger.apiReadError('trivia_questions', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
				topic: body.topic,
				difficulty: body.difficulty,
				questionCount: body.questionCount,
			});
			throw error;
		}
	}

	/**
	 * Get game history
	 */
	@Get('history')
	async getGameHistory(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.gameService.getUserGameHistory(req.user.id);

			// Log API call for game history request
			this.logger.apiRead('game_history', {
				userId: req.user.id,
				totalGames: result.totalGames,
			});

			return result;
		} catch (error) {
			this.logger.apiReadError('game_history', error instanceof Error ? error.message : 'Unknown error', {
				userId: req.user?.id,
			});
			throw error;
		}
	}

	/**
	 * Get leaderboard
	 */
	@Get('leaderboard')
	async getLeaderboard() {
		try {
			const result = await this.gameService.getLeaderboard();

			// Log API call for leaderboard request
			this.logger.apiRead('leaderboard', {});

			return result;
		} catch (error) {
			this.logger.apiReadError('leaderboard', error instanceof Error ? error.message : 'Unknown error', {});
			throw error;
		}
	}

	/**
	 * Validate custom difficulty text
	 */
	@Post('validate-custom')
	async validateCustomDifficulty(@Body() body: { customText: string }) {
		try {
			// Basic validation first
			const basicValidation = await this.validationService.validateCustomDifficultyText(body.customText);

			if (!basicValidation.isValid) {
				// Log API call for validation failure
				this.logger.apiUpdate('custom_difficulty_validation', {
					isValid: false,
					errorsCount: basicValidation.errors.length,
				});

				return {
					isValid: false,
					errors: basicValidation.errors,
					suggestion: basicValidation.suggestion,
				};
			}

			// Language validation
			const languageValidation = await this.validationService.validateInputWithLanguageTool(body.customText, {
				language: 'auto',
				enableSpellCheck: true,
				enableGrammarCheck: true,
				enableLanguageDetection: true,
			} as LanguageValidationOptions);

			// Log API call for validation success
			this.logger.apiUpdate('custom_difficulty_validation', {
				isValid: languageValidation.isValid,
				errorsCount: languageValidation.errors.length,
			});

			return {
				isValid: languageValidation.isValid,
				errors: languageValidation.errors,
				suggestion: languageValidation.suggestion,
			};
		} catch (error) {
			this.logger.apiUpdateError(
				'custom_difficulty_validation',
				error instanceof Error ? error.message : 'Unknown error',
				{
					customText: body.customText,
				}
			);
			throw error;
		}
	}

	/**
	 * Validate text with language tool
	 */
	@Post('validate-language')
	async validateLanguage(
		@Body() body: { text: string; language?: string; enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
	) {
		try {
			const languageValidation = await this.validationService.validateInputWithLanguageTool(body.text, {
				language: body.language,
				enableSpellCheck: body.enableSpellCheck ?? true,
				enableGrammarCheck: body.enableGrammarCheck ?? true,
				enableLanguageDetection: true,
			} as LanguageValidationOptions);

			// Log API call for language validation
			this.logger.apiUpdate('language_validation', {
				isValid: languageValidation.isValid,
				errorsCount: languageValidation.errors.length,
				language: body.language || 'auto',
			});

			return {
				isValid: languageValidation.isValid,
				errors: languageValidation.errors,
				suggestions: languageValidation.suggestion ? [languageValidation.suggestion] : [],
				language: languageValidation.suggestion ? 'detected' : undefined,
			};
		} catch (error) {
			this.logger.apiUpdateError('language_validation', error instanceof Error ? error.message : 'Unknown error', {
				text: body.text,
				language: body.language,
			});
			throw error;
		}
	}
}
