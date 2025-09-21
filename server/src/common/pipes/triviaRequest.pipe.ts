/**
 * Trivia Request Validation Pipe
 *
 * @module TriviaRequestPipe
 * @description Pipe for validating trivia request data
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { serverLogger as logger , TriviaRequestData, TriviaRequestValidationResult, VALIDATION_LIMITS } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaRequestData): Promise<TriviaRequestValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_request', '[REDACTED]', 'validation_start');

			const errors: string[] = [];

			// Enhanced input validation
			if (!value.topic || value.topic.trim().length === 0) {
				errors.push('Topic is required');
			}

			if (!value.difficulty || value.difficulty.trim().length === 0) {
				errors.push('Difficulty is required');
			}

			if (!value.questionCount || value.questionCount < VALIDATION_LIMITS.QUESTION_COUNT.MIN || value.questionCount > VALIDATION_LIMITS.QUESTION_COUNT.MAX) {
				errors.push(`Question count must be between ${VALIDATION_LIMITS.QUESTION_COUNT.MIN} and ${VALIDATION_LIMITS.QUESTION_COUNT.MAX}`);
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
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.validationError('trivia_request', '[REDACTED]', 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			logger.apiUpdateError('triviaRequestValidation', error instanceof Error ? error.message : 'Unknown error');

			throw new BadRequestException('Trivia request validation failed');
		}
	}
}
