/**
 * Trivia Request Validation Pipe
 *
 * @module TriviaRequestPipe
 * @description Pipe for validating trivia request data
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { serverLogger as logger } from '@shared/services';
import { TriviaRequest, ValidationResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaRequest): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_request', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Validate trivia request using service (business rules)
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
