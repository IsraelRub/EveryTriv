/**
 * Trivia Request Validation Pipe
 *
 * @module TriviaRequestPipe
 * @description Pipe for validating trivia request data
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { CUSTOM_DIFFICULTY_PREFIX, VALID_DIFFICULTIES } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { GameDifficulty, TriviaRequest } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: TriviaRequest | string): Promise<TriviaRequest> {
		const startTime = Date.now();

		try {
			logger.validationDebug('trivia_request', '[REDACTED]', 'validation_start');

			const payload = this.buildTriviaPayload(value);

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Validate trivia request using service (business rules)
			if (errors.length === 0) {
				const triviaValidation = await this.validationService.validateTriviaRequest(
					payload.topic,
					payload.difficulty,
					payload.questionCount
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

			if (errors.length === 0) {
				logger.validationInfo('trivia_request', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('trivia_request', '[REDACTED]', 'validation_failed', {
					errors,
				});
			}

			// Log API call
			logger.apiUpdate('trivia_request_validation', {
				isValid: errors.length === 0,
				errorsCount: errors.length,
				duration: Date.now() - startTime,
			});

			if (errors.length > 0) {
				throw new BadRequestException({
					message: 'Invalid trivia request',
					errors,
					suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
				});
			}

			return payload;
		} catch (error) {
			logger.validationError('trivia_request', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('triviaRequestValidation', getErrorMessage(error));

			throw new BadRequestException('Trivia request validation failed');
		}
	}

	private buildTriviaPayload(value: TriviaRequest | string): TriviaRequest {
		const source = this.normalizeValue(value);

		if (!this.isTriviaRequest(source)) {
			throw new BadRequestException('Invalid trivia request payload structure');
		}

		return this.sanitizeTriviaRequest(source);
	}

	private normalizeValue(value: TriviaRequest | string): unknown {
		if (typeof value === 'string') {
			const parsedValue: unknown = JSON.parse(value);
			return parsedValue;
		}

		return value;
	}

	private isTriviaRequest(candidate: unknown): candidate is TriviaRequest {
		if (!this.isPlainObject(candidate)) {
			return false;
		}

		const { questionCount, topic, difficulty } = candidate;
		if (
			!this.isValidQuestionCount(questionCount) ||
			!this.isNonEmptyString(topic) ||
			!this.isGameDifficulty(difficulty)
		) {
			return false;
		}

		return this.areOptionalTriviaFieldsValid(candidate);
	}

	private isPlainObject(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	private isValidQuestionCount(value: unknown): value is number {
		return typeof value === 'number' && Number.isInteger(value) && value > 0;
	}

	private isNonEmptyString(value: unknown): value is string {
		return typeof value === 'string' && value.trim().length > 0;
	}

	private isGameDifficulty(value: unknown): value is GameDifficulty {
		if (typeof value !== 'string') {
			return false;
		}

		if (VALID_DIFFICULTIES.some(difficulty => difficulty === value)) {
			return true;
		}

		return value.startsWith(CUSTOM_DIFFICULTY_PREFIX) && value.length > CUSTOM_DIFFICULTY_PREFIX.length;
	}

	private areOptionalTriviaFieldsValid(candidate: Record<string, unknown>): boolean {
		const optionalChecks: boolean[] = [
			this.isOptionalString(candidate.category),
			this.isOptionalString(candidate.userId),
			this.isOptionalString(candidate.gameMode),
			this.isOptionalNumber(candidate.timeLimit),
			this.isOptionalNumber(candidate.questionLimit),
		];

		return optionalChecks.every(Boolean);
	}

	private isOptionalString(value: unknown): boolean {
		return value === undefined || typeof value === 'string';
	}

	private isOptionalNumber(value: unknown): boolean {
		return value === undefined || (typeof value === 'number' && Number.isFinite(value));
	}

	private sanitizeTriviaRequest(candidate: TriviaRequest): TriviaRequest {
		const sanitized: TriviaRequest = {
			questionCount: candidate.questionCount,
			topic: candidate.topic,
			difficulty: candidate.difficulty,
		};

		if (candidate.category !== undefined) {
			sanitized.category = candidate.category;
		}

		if (candidate.userId !== undefined) {
			sanitized.userId = candidate.userId;
		}

		if (candidate.gameMode !== undefined) {
			sanitized.gameMode = candidate.gameMode;
		}

		if (candidate.timeLimit !== undefined) {
			sanitized.timeLimit = candidate.timeLimit;
		}

		if (candidate.questionLimit !== undefined) {
			sanitized.questionLimit = candidate.questionLimit;
		}

		return sanitized;
	}
}
