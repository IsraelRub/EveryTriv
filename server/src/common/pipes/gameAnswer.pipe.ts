/**
 * Game Answer Validation Pipe
 *
 * @module GameAnswerPipe
 * @description Pipe for validating game answer submission data
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { GameAnswerSubmission } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { ValidationService } from '../validation';

@Injectable()
export class GameAnswerPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: GameAnswerSubmission): Promise<GameAnswerSubmission> {
		const startTime = Date.now();

		try {
			logger.validationDebug('game_answer', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Validate answer content (semantic/content rules)
			// Only validate string answers, number answers are validated by type
			if (typeof value.answer === 'string' && value.answer.trim().length > 0) {
				const answerValidation = await this.validationService.validateInputContent(value.answer);
				if (!answerValidation.isValid) {
					errors.push(...answerValidation.errors);
					if (answerValidation.suggestion) {
						suggestions.push(answerValidation.suggestion);
					}
				}
			}

			const isValid = errors.length === 0;

			// Log validation result
			if (isValid) {
				logger.validationInfo('game_answer', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('game_answer', '[REDACTED]', 'validation_failed', {
					errors,
				});
			}

			// Log API call
			logger.apiUpdate('game_answer_validation', {
				isValid,
				errorsCount: errors.length,
				duration: Date.now() - startTime,
			});

			if (!isValid) {
				throw new BadRequestException(errors.join(', ') || 'Invalid answer submission');
			}

			return value;
		} catch (error) {
			// If it's already a BadRequestException from validation, re-throw it
			if (error instanceof BadRequestException) {
				throw error;
			}

			logger.validationError('game_answer', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('gameAnswerValidation', getErrorMessage(error));

			// Re-throw the original error if it's not a validation error
			throw error;
		}
	}
}
