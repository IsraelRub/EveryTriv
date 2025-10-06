/**
 * Game Answer Validation Pipe
 *
 * @module GameAnswerPipe
 * @description Pipe for validating game answer submission data
 * @used_by server/src/features/game, server/src/controllers
 */
import { GameAnswerData, ValidationResult, getErrorMessage, serverLogger as logger } from '@shared';

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class GameAnswerPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: GameAnswerData): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('game_answer', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Enhanced input validation
			if (!value.questionId || value.questionId.trim().length === 0) {
				errors.push('Question ID is required');
				suggestions.push('Please provide a valid question ID');
			}

			if (!value.answer || value.answer.trim().length === 0) {
				errors.push('Answer is required');
				suggestions.push('Please select an answer option');
			}

			if (value.timeSpent < 0) {
				errors.push('Time spent cannot be negative');
				suggestions.push('Time spent should be 0 or positive');
			}

			// Validate answer content if answer exists
			if (value.answer && value.answer.trim().length > 0) {
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

			return {
				isValid,
				errors,
				suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
			};
		} catch (error) {
			logger.validationError('game_answer', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('gameAnswerValidation', getErrorMessage(error));

			throw new BadRequestException('Game answer validation failed');
		}
	}
}
