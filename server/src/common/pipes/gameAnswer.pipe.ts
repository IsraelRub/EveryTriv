/**
 * Game Answer Validation Pipe
 *
 * @module GameAnswerPipe
 * @description Pipe for validating game answer submission data
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { GameAnswerData, GameAnswerValidationResult,serverLogger as logger, getErrorMessage  } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class GameAnswerPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: GameAnswerData): Promise<GameAnswerValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('game_answer', '[REDACTED]', 'validation_start');

			const errors: string[] = [];

			// Enhanced input validation
			if (!value.questionId || value.questionId.trim().length === 0) {
				errors.push('Question ID is required');
			}

			if (!value.answer || value.answer.trim().length === 0) {
				errors.push('Answer is required');
			}

			if (value.timeSpent < 0) {
				errors.push('Time spent cannot be negative');
			}

			// Validate answer content if answer exists
			if (value.answer && value.answer.trim().length > 0) {
				const answerValidation = await this.validationService.validateInputContent(value.answer);
				if (!answerValidation.isValid) {
					errors.push(...answerValidation.errors);
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
				success: true,
				timestamp: new Date().toISOString(),
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
