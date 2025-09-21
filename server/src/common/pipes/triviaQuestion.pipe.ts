/**
 * Trivia Question Validation Pipe
 *
 * @module TriviaQuestionPipe
 * @description Pipe for validating trivia question data input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ValidationResult } from '@shared';
import { serverLogger as logger , TriviaQuestionData, TriviaQuestionValidationResult } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class TriviaQuestionPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaQuestionData): Promise<TriviaQuestionValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_question', '[REDACTED]', 'validation_start');

			const errors: string[] = [];

			// Validate question text
			if (!value.question || value.question.trim().length === 0) {
				errors.push('Question text is required');
			} else if (value.question.length > 1000) {
				errors.push('Question text is too long (max 1000 characters)');
			} else if (value.question.length < 10) {
				errors.push('Question text must be at least 10 characters long');
			} else {
				const questionValidation: ValidationResult = await this.validationService.validateInputContent(
					value.question,
					{}
				);
				if (!questionValidation.isValid) {
					errors.push(...questionValidation.errors);
				}
			}

			// Validate options
			if (!value.options || !Array.isArray(value.options) || value.options.length < 2) {
				errors.push('At least 2 options are required');
			} else if (value.options.length > 6) {
				errors.push('Maximum 6 options allowed');
			} else {
				for (let i = 0; i < value.options.length; i++) {
					const option = value.options[i];
					if (!option || option.trim().length === 0) {
						errors.push(`Option ${i + 1} cannot be empty`);
					} else if (option.length > 200) {
						errors.push(`Option ${i + 1} is too long (max 200 characters)`);
					}
				}
			}

			// Validate correct answer
			if (!value.correctAnswer || value.correctAnswer.trim().length === 0) {
				errors.push('Correct answer is required');
			} else if (!value.options || !value.options.includes(value.correctAnswer)) {
				errors.push('Correct answer must match one of the provided options');
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
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.validationError('trivia_question', '[REDACTED]', 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			logger.apiUpdateError('trivia_question_validation', error instanceof Error ? error.message : 'Unknown error', {
				duration: Date.now() - startTime,
			});

			throw new BadRequestException('Trivia question validation failed');
		}
	}
}
