/**
 * Trivia Request Validation Pipe
 *
 * @module TriviaRequestPipe
 * @description Pipe for validating trivia request data
 * @used_by server/src/features/game, server/src/controllers
 */
import {
	TriviaRequestData,
	VALIDATION_LIMITS,
	ValidationResult,
	getErrorMessage,
	serverLogger as logger,
} from '@shared';

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaRequestData): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_request', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Enhanced input validation
			if (!value.topic || value.topic.trim().length === 0) {
				errors.push('Topic is required');
				suggestions.push('Please enter a topic for your trivia questions (e.g., "Science", "History", "Sports")');
			} else if (value.topic.trim().length < 2) {
				errors.push('Topic must be at least 2 characters long');
				suggestions.push('Provide a more specific topic (e.g., "World History" instead of "Hi")');
			} else if (value.topic.trim().length > 100) {
				errors.push('Topic is too long (maximum 100 characters)');
				suggestions.push('Shorten your topic to 100 characters or less');
			}

			if (!value.difficulty || value.difficulty.trim().length === 0) {
				errors.push('Difficulty is required');
				suggestions.push('Choose a difficulty level: easy, medium, hard, or expert');
			} else {
				const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
				if (!validDifficulties.includes(value.difficulty.toLowerCase())) {
					errors.push('Invalid difficulty level');
					suggestions.push('Use one of these difficulty levels: easy, medium, hard, expert');
				}
			}

			if (
				!value.questionCount ||
				value.questionCount < VALIDATION_LIMITS.QUESTION_COUNT.MIN ||
				value.questionCount > VALIDATION_LIMITS.QUESTION_COUNT.MAX
			) {
				errors.push(
					`Question count must be between ${VALIDATION_LIMITS.QUESTION_COUNT.MIN} and ${VALIDATION_LIMITS.QUESTION_COUNT.MAX}`
				);
				suggestions.push(
					`Choose between ${VALIDATION_LIMITS.QUESTION_COUNT.MIN} and ${VALIDATION_LIMITS.QUESTION_COUNT.MAX} questions for your trivia game`
				);
			}

			// Validate trivia request using service if basic validation passes
			if (errors.length === 0) {
				const triviaValidation = await this.validationService.validateTriviaRequest(
					value.topic,
					value.difficulty,
					value.questionCount
				);

				if (!triviaValidation.isValid) {
					errors.push(...triviaValidation.errors);
					// Add suggestions based on common trivia request issues
					if (triviaValidation.errors.some(e => e.includes('topic'))) {
						suggestions.push('Try a more popular topic like "Science", "History", "Sports", or "Geography"');
					}
					if (triviaValidation.errors.some(e => e.includes('difficulty'))) {
						suggestions.push('Start with "easy" difficulty if you\'re unsure');
					}
					if (triviaValidation.errors.some(e => e.includes('count'))) {
						suggestions.push('Try 5-10 questions for a good game length');
					}
				}
			}

			const isValid = errors.length === 0;

			// Log validation result
			if (isValid) {
				logger.validationInfo('trivia_request', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('trivia_request', '[REDACTED]', 'validation_failed', {
					errors,
				});
			}

			// Log API call
			logger.apiUpdate('trivia_request_validation', {
				isValid,
				errorsCount: errors.length,
				duration: Date.now() - startTime,
			});

			return {
				isValid,
				errors,
				suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
			};
		} catch (error) {
			logger.validationError('trivia_request', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('triviaRequestValidation', getErrorMessage(error));

			throw new BadRequestException('Trivia request validation failed');
		}
	}
}
