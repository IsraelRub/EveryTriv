/**
 * Trivia Question Validation Pipe
 *
 * @module TriviaQuestionPipe
 * @description Pipe for validating trivia question data input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ERROR_CODES } from '@shared/constants';
import { TriviaQuestionPayload, ValidationResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import { validateTriviaQuestion, type TriviaQuestionValidationPayload } from '@internal/validation/domain';

import { ValidationService } from '../validation';

@Injectable()
export class TriviaQuestionPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaQuestionPayload): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_question', '[REDACTED]', 'validation_start');

			const suggestions: string[] = [];

			// Use shared validation function
			const validationPayload: TriviaQuestionValidationPayload = {
				question: value.question,
				answers: value.answers,
				correctAnswerIndex: value.correctAnswerIndex,
				topic: value.topic,
				difficulty: value.difficulty,
			};

			const validationResult = validateTriviaQuestion(validationPayload);
			const errors: string[] = [...validationResult.errors];

			// Add content validation for question text if it passes basic validation
			if (validationResult.isValid && value.question) {
				const questionContentValidation: ValidationResult = await this.validationService.validateInputContent(
					value.question,
					{}
				);
				if (!questionContentValidation.isValid) {
					errors.push(...questionContentValidation.errors);
					if (questionContentValidation.suggestion) {
						suggestions.push(questionContentValidation.suggestion);
					}
				}
			}

			// Generate suggestions based on errors
			if (errors.length > 0) {
				if (errors.some(e => e.includes('Question'))) {
					suggestions.push('Enter a clear, specific question that players can understand');
				}
				if (errors.some(e => e.includes('answer') && e.includes('required'))) {
					suggestions.push('Provide 2-6 answer options for your question');
				}
				if (errors.some(e => e.includes('Correct answer index'))) {
					suggestions.push('Provide the index of the correct answer (0-based index)');
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

			throw new BadRequestException(ERROR_CODES.TRIVIA_QUESTION_VALIDATION_FAILED);
		}
	}
}
