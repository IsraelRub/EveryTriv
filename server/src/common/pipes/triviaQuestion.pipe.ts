/**
 * Trivia Question Validation Pipe
 *
 * @module TriviaQuestionPipe
 * @description Pipe for validating trivia question data input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage,TriviaQuestionData, ValidationResult } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class TriviaQuestionPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaQuestionData): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_question', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Validate question text
			if (!value.question || value.question.trim().length === 0) {
				errors.push('Question text is required');
				suggestions.push('Enter a clear, specific question that players can understand');
			} else if (value.question.length > 1000) {
				errors.push('Question text is too long (max 1000 characters)');
				suggestions.push('Shorten your question to 1000 characters or less for better readability');
			} else if (value.question.length < 10) {
				errors.push('Question text must be at least 10 characters long');
				suggestions.push('Make your question more detailed (at least 10 characters)');
			} else {
				const questionValidation: ValidationResult = await this.validationService.validateInputContent(
					value.question,
					{}
				);
				if (!questionValidation.isValid) {
					errors.push(...questionValidation.errors);
					if (questionValidation.suggestion) {
						suggestions.push(questionValidation.suggestion);
					}
				}
			}

			// Validate options
			if (!value.options || !Array.isArray(value.options) || value.options.length < 2) {
				errors.push('At least 2 options are required');
				suggestions.push('Provide 2-6 answer options for your question');
			} else if (value.options.length > 6) {
				errors.push('Maximum 6 options allowed');
				suggestions.push('Limit your options to 6 or fewer for better user experience');
			} else {
				for (let i = 0; i < value.options.length; i++) {
					const option = value.options[i];
					if (!option || option.trim().length === 0) {
						errors.push(`Option ${i + 1} cannot be empty`);
						suggestions.push(`Provide text for option ${i + 1}`);
					} else if (option.length > 200) {
						errors.push(`Option ${i + 1} is too long (max 200 characters)`);
						suggestions.push(`Shorten option ${i + 1} to 200 characters or less`);
					}
				}
			}

			// Validate correct answer
			if (!value.correctAnswer || value.correctAnswer.trim().length === 0) {
				errors.push('Correct answer is required');
				suggestions.push('Select which option is the correct answer');
			} else if (!value.options || !value.options.includes(value.correctAnswer)) {
				errors.push('Correct answer must match one of the provided options');
				suggestions.push('Make sure the correct answer exactly matches one of your options');
			}

			// Validate difficulty if provided
			if (value.difficulty) {
				// Basic difficulty validation
				if (typeof value.difficulty !== 'string' || value.difficulty.length < 2) {
					errors.push('Difficulty must be a valid string with at least 2 characters');
				}
			}

			// Validate topic if provided
			if (value.topic) {
				// Basic topic validation
				if (typeof value.topic !== 'string' || value.topic.length < 2 || value.topic.length > 100) {
					errors.push('Topic must be a valid string between 2 and 100 characters');
				}
			}

			const isValid = errors.length === 0;

			// Log validation result
			if (isValid) {
				logger.validationInfo('trivia_question', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('trivia_question', '[REDACTED]', 'validation_failed', {
					errors,
				});
			}

			// Log API call
			logger.apiUpdate('trivia_question_validation', {
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
			logger.validationError('trivia_question', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('trivia_question_validation', getErrorMessage(error), {
				duration: Date.now() - startTime,
			});

			throw new BadRequestException('Trivia question validation failed');
		}
	}
}
