import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { VALIDATION_COUNT, VALIDATORS } from '@shared/constants';
import { TriviaRequest } from '@shared/types';
import { getErrorMessage, isNonEmptyString, isRecord } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import { TriviaRequestDto } from '@features/game/dtos';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	async transform(value: unknown): Promise<TriviaRequestDto> {
		try {
			// Debug: Log what we receive
			const isStringValue = typeof value === 'string';
			logger.validationDebug('trivia_request', '[REDACTED]', 'transformation_start', {
				type: typeof value,
				data: {
					isObject: isRecord(value),
					isNull: value === null,
					isString: isStringValue,
					stringLength: isStringValue ? value.length : undefined,
					stringPreview: isStringValue ? value.substring(0, 100) : undefined,
				},
			});

			const payload = this.buildTriviaPayload(value);

			// Convert UNLIMITED_QUESTIONS (-1) to MAX for DTO validation
			// The DTO validator expects MAX when UNLIMITED is provided
			const { UNLIMITED, MAX } = VALIDATION_COUNT.QUESTIONS;
			const questionsPerRequestForValidation =
				payload.questionsPerRequest === UNLIMITED ? MAX : payload.questionsPerRequest;

			// Create and return TriviaRequestDto with converted questionsPerRequest
			// Validation will be handled by NestJS ValidationPipe using DTO decorators
			return this.createTriviaRequestDto(payload, questionsPerRequestForValidation);
		} catch (error) {
			const errorMessage = getErrorMessage(error);

			logger.validationError('trivia_request', '[REDACTED]', 'transformation_error', {
				errorInfo: { message: errorMessage },
			});

			logger.apiUpdateError('triviaRequestTransformation', errorMessage);

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException({
				message: 'Trivia request transformation failed',
				errors: [errorMessage],
			});
		}
	}

	private buildTriviaPayload(value: unknown): TriviaRequest {
		// Debug: Log before normalization
		logger.validationDebug('trivia_request', '[REDACTED]', 'build_payload_start', {
			type: typeof value,
			data: {
				isPlainObject: isRecord(value),
			},
		});

		// First check if value is already a plain object (most common case)
		if (!isRecord(value)) {
			// If not, try to normalize it (handles string edge cases)
			const normalized = this.normalizeValue(value);

			// Debug: Log after normalization
			logger.validationDebug('trivia_request', '[REDACTED]', 'build_payload_after_normalize', {
				type: typeof normalized,
				data: {
					isPlainObject: isRecord(normalized),
				},
			});

			if (!isRecord(normalized)) {
				throw new BadRequestException({
					message: 'Invalid trivia request payload structure',
					errors: [
						`Request body must be a valid object (received: ${typeof normalized}, isArray: ${Array.isArray(normalized)}, isNull: ${normalized === null})`,
					],
				});
			}
			value = normalized;
		}

		if (!this.isTriviaRequest(value)) {
			// Collect validation details for better error message
			const details: string[] = [];
			if (isRecord(value)) {
				details.push(
					`topic: ${typeof value.topic}${value.topic ? ` (${String(value.topic).substring(0, 20)})` : ' (missing)'}`
				);
				details.push(
					`difficulty: ${typeof value.difficulty}${value.difficulty ? ` (${String(value.difficulty)})` : ' (missing)'}`
				);
				details.push(
					`questionsPerRequest: ${typeof value.questionsPerRequest}${value.questionsPerRequest !== undefined ? ` (${value.questionsPerRequest})` : ' (missing)'}`
				);
			} else {
				details.push(`value type: ${typeof value}`);
			}
			throw new BadRequestException({
				message: 'Invalid trivia request payload structure',
				errors: [
					`Payload must contain valid topic, difficulty, and questionsPerRequest fields. Received: ${details.join(', ')}`,
				],
			});
		}

		return value;
	}

	private normalizeValue(value: unknown): unknown {
		// Debug: Log what we're trying to normalize
		const isStringValue = typeof value === 'string';
		logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_start', {
			type: typeof value,
			data: {
				isString: isStringValue,
				stringLength: isStringValue ? value.length : undefined,
				stringPreview: isStringValue ? value.substring(0, 200) : undefined,
				isObject: isRecord(value),
				isNull: value === null,
			},
		});

		// Framework typically parses JSON body, so value should be an object
		// Handle edge cases where value might be a string (shouldn't happen in normal flow)
		if (typeof value === 'string') {
			// Empty string or whitespace - invalid
			if (value.trim().length === 0) {
				logger.validationWarn('trivia_request', '[REDACTED]', 'normalize_empty_string', {
					type: typeof value,
					valueLength: value.length,
				});
				throw new BadRequestException({
					message: 'Invalid request body format',
					errors: [`Request body cannot be empty (received: ${typeof value}, length: ${value.length})`],
				});
			}
			// Check if string looks like JSON (starts with { or [)
			if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
				logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_attempting_json_parse', {
					data: {
						preview: value.substring(0, 100),
					},
				});
				try {
					const parsedValue: unknown = JSON.parse(value);
					logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_json_parse_success', {
						type: typeof parsedValue,
						data: {
							isObject: isRecord(parsedValue),
						},
					});
					return parsedValue;
				} catch (error) {
					// If parsing fails, throw a more descriptive error
					logger.validationError('trivia_request', '[REDACTED]', 'normalize_json_parse_failed', {
						errorInfo: { message: getErrorMessage(error) },
						data: {
							preview: value.substring(0, 100),
						},
					});
					throw new BadRequestException({
						message: 'Invalid JSON format in request body',
						errors: [`JSON parsing failed: ${getErrorMessage(error)} (preview: ${value.substring(0, 50)}...)`],
					});
				}
			}
			// If string doesn't look like JSON, throw error
			logger.validationWarn('trivia_request', '[REDACTED]', 'normalize_string_not_json', {
				type: typeof value,
				valueLength: value.length,
				data: {
					preview: value.substring(0, 100),
					startsWithBrace: value.trim().startsWith('{'),
					startsWithBracket: value.trim().startsWith('['),
				},
			});
			throw new BadRequestException({
				message: 'Invalid request body format',
				errors: [
					`Request body must be a valid JSON object (received: ${typeof value}, length: ${value.length}, preview: ${value.substring(0, 50)}...)`,
				],
			});
		}

		// If value is already an object, return it as-is
		logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_returning_as_is', {
			type: typeof value,
			data: {
				isObject: isRecord(value),
			},
		});
		return value;
	}

	private isTriviaRequest(candidate: unknown): candidate is TriviaRequest {
		if (!isRecord(candidate)) {
			return false;
		}

		const { questionsPerRequest, topic, difficulty } = candidate;
		// Basic type checks - business validation happens in DTO
		if (
			!this.isValidQuestionsPerRequest(questionsPerRequest) ||
			!isNonEmptyString(topic) ||
			typeof difficulty !== 'string'
		) {
			return false;
		}

		return this.areOptionalTriviaFieldsValid(candidate);
	}

	private isValidQuestionsPerRequest(value: unknown): value is number {
		if (!VALIDATORS.number(value) || !Number.isInteger(value)) {
			return false;
		}
		const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
		return value === UNLIMITED || (value >= MIN && value <= MAX);
	}

	private areOptionalTriviaFieldsValid(candidate: Record<string, unknown>): boolean {
		const optionalChecks: boolean[] = [
			this.isOptionalString(candidate.category),
			this.isOptionalString(candidate.userId),
			this.isOptionalString(candidate.gameMode),
			this.isOptionalNumber(candidate.timeLimit),
			this.isOptionalNumber(candidate.maxQuestionsPerGame),
			this.isOptionalNumber(candidate.answerCount),
		];

		return optionalChecks.every(Boolean);
	}

	private isOptionalString(value: unknown): boolean {
		return value == null || VALIDATORS.string(value);
	}

	private isOptionalNumber(value: unknown): boolean {
		return value == null || VALIDATORS.number(value);
	}

	private createTriviaRequestDto(payload: TriviaRequest, questionsPerRequest: number): TriviaRequestDto {
		const dto = new TriviaRequestDto();
		dto.topic = payload.topic;
		dto.difficulty = payload.difficulty;
		dto.mappedDifficulty = toDifficultyLevel(payload.difficulty);
		dto.questionsPerRequest = questionsPerRequest;

		if (payload.category !== undefined) {
			dto.category = payload.category;
		}

		if (payload.userId !== undefined) {
			dto.userId = payload.userId;
		}

		if (payload.gameMode !== undefined) {
			dto.gameMode = payload.gameMode;
		}

		if (payload.timeLimit !== undefined) {
			dto.timeLimit = payload.timeLimit;
		}

		if (payload.maxQuestionsPerGame !== undefined) {
			dto.maxQuestionsPerGame = payload.maxQuestionsPerGame;
		}

		if (payload.answerCount !== undefined) {
			dto.answerCount = payload.answerCount;
		}

		return dto;
	}
}
