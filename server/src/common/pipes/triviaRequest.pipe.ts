import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { VALIDATION_COUNT, VALIDATION_LENGTH } from '@shared/constants';
import type { TriviaRequest } from '@shared/types';
import { getErrorMessage, isNonEmptyString, isRecord, sanitizeInput, truncateWithEllipsis } from '@shared/utils';
import { isLocale, validateTriviaRequest, VALIDATORS } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import { TriviaRequestDto } from '@features/game/dtos';

import { LanguageToolService } from '../validation';

@Injectable()
export class TriviaRequestPipe implements PipeTransform {
	constructor(private readonly languageToolService: LanguageToolService) {}

	async transform(value: unknown): Promise<TriviaRequestDto> {
		try {
			// Debug: Log what we receive
			logger.validationDebug('trivia_request', '[REDACTED]', 'transformation_start', {
				type: typeof value,
				isObject: isRecord(value),
				isNull: value === null,
				isString: VALIDATORS.string(value),
				valueLength: VALIDATORS.string(value) ? value.length : undefined,
				preview: VALIDATORS.string(value) ? value.substring(0, 100) : undefined,
			});

			const payload = this.buildTriviaPayload(value);

			const triviaValidation = validateTriviaRequest(payload.topic, payload.difficulty);
			if (!triviaValidation.isValid) {
				throw new BadRequestException({
					message: 'Trivia request validation failed',
					errors: triviaValidation.errors,
				});
			}

			const topicLanguageValidation = await this.languageToolService.checkText(payload.topic, {
				enableSpellCheck: true,
				enableGrammarCheck: true,
				language: payload.outputLanguage,
				detectLanguage: false,
			});
			if (!topicLanguageValidation.isValid) {
				throw new BadRequestException({
					message: 'Topic language validation failed',
					errors: topicLanguageValidation.errors,
				});
			}

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
			isPlainObject: isRecord(value),
		});

		// First check if value is already a plain object (most common case)
		if (!isRecord(value)) {
			// If not, try to normalize it (handles string edge cases)
			const normalized = this.normalizeValue(value);

			// Debug: Log after normalization
			logger.validationDebug('trivia_request', '[REDACTED]', 'build_payload_after_normalize', {
				type: typeof normalized,
				isPlainObject: isRecord(normalized),
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
				details.push(
					`answerCount: ${typeof value.answerCount}${value.answerCount !== undefined ? ` (${value.answerCount})` : ' (missing)'}`
				);
				details.push(
					`outputLanguage: ${typeof value.outputLanguage}${value.outputLanguage ? ` (${value.outputLanguage})` : ' (missing)'}`
				);
			} else {
				details.push(`value type: ${typeof value}`);
			}
			throw new BadRequestException({
				message: 'Invalid trivia request payload structure',
				errors: [
					`Payload must contain valid topic, difficulty, questionsPerRequest, answerCount, and outputLanguage. Received: ${details.join(', ')}`,
				],
			});
		}

		return value;
	}

	private normalizeValue(value: unknown): unknown {
		// Debug: Log what we're trying to normalize
		logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_start', {
			type: typeof value,
			isString: VALIDATORS.string(value),
			valueLength: VALIDATORS.string(value) ? value.length : undefined,
			preview: VALIDATORS.string(value) ? value.substring(0, 200) : undefined,
			isObject: isRecord(value),
			isNull: value === null,
		});

		// Framework typically parses JSON body, so value should be an object
		// Handle edge cases where value might be a string (shouldn't happen in normal flow)
		if (VALIDATORS.string(value)) {
			const trimmedValue = value.trim();
			if (trimmedValue.length === 0) {
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
			if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
				logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_attempting_json_parse', {
					preview: trimmedValue.substring(0, 100),
				});
				try {
					const parsedValue: unknown = JSON.parse(trimmedValue);
					logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_json_parse_success', {
						type: typeof parsedValue,
						isObject: isRecord(parsedValue),
					});
					return parsedValue;
				} catch (error) {
					// If parsing fails, throw a more descriptive error
					logger.validationError('trivia_request', '[REDACTED]', 'normalize_json_parse_failed', {
						errorInfo: { message: getErrorMessage(error) },
						preview: value.substring(0, 100),
					});
					throw new BadRequestException({
						message: 'Invalid JSON format in request body',
						errors: [
							`JSON parsing failed: ${getErrorMessage(error)} (preview: ${truncateWithEllipsis(trimmedValue, VALIDATION_LENGTH.STRING_TRUNCATION.SHORT)})`,
						],
					});
				}
			}
			// If string doesn't look like JSON, throw error
			logger.validationWarn('trivia_request', '[REDACTED]', 'normalize_string_not_json', {
				type: typeof value,
				valueLength: value.length,
				preview: trimmedValue.substring(0, 100),
				startsWithBrace: trimmedValue.startsWith('{'),
				startsWithBracket: trimmedValue.startsWith('['),
			});
			throw new BadRequestException({
				message: 'Invalid request body format',
				errors: [
					`Request body must be a valid JSON object (received: ${typeof value}, length: ${value.length}, preview: ${truncateWithEllipsis(trimmedValue, VALIDATION_LENGTH.STRING_TRUNCATION.SHORT)})`,
				],
			});
		}

		// If value is already an object, return it as-is
		logger.validationDebug('trivia_request', '[REDACTED]', 'normalize_returning_as_is', {
			type: typeof value,
			isObject: isRecord(value),
		});
		return value;
	}

	private isTriviaRequest(candidate: unknown): candidate is TriviaRequest {
		if (!isRecord(candidate)) {
			return false;
		}

		const { questionsPerRequest, topic, difficulty, answerCount, outputLanguage } = candidate;
		if (
			!this.isValidQuestionsPerRequest(questionsPerRequest) ||
			!isNonEmptyString(topic) ||
			!VALIDATORS.string(difficulty) ||
			!this.isValidAnswerCount(answerCount) ||
			!isLocale(outputLanguage)
		) {
			return false;
		}

		return this.areOptionalTriviaFieldsValid(candidate);
	}

	private isValidAnswerCount(value: unknown): value is number {
		if (!VALIDATORS.number(value) || !Number.isInteger(value)) {
			return false;
		}
		const { MIN, MAX } = VALIDATION_COUNT.ANSWER_COUNT;
		return value >= MIN && value <= MAX;
	}

	private isValidQuestionsPerRequest(value: unknown): value is number {
		if (!VALIDATORS.number(value) || !Number.isInteger(value)) {
			return false;
		}
		const { MIN, MAX, UNLIMITED } = VALIDATION_COUNT.QUESTIONS;
		return value === UNLIMITED || (value >= MIN && value <= MAX);
	}

	private areOptionalTriviaFieldsValid(candidate: Record<string, unknown>): boolean {
		return this.isOptionalString(candidate.gameId);
	}

	private isOptionalString(value: unknown): boolean {
		return value == null || VALIDATORS.string(value);
	}

	private createTriviaRequestDto(payload: TriviaRequest, questionsPerRequest: number): TriviaRequestDto {
		const dto = new TriviaRequestDto();
		dto.topic = sanitizeInput(payload.topic, 500);
		dto.difficulty = payload.difficulty;
		dto.questionsPerRequest = questionsPerRequest;

		if (payload.gameId !== undefined) {
			dto.gameId = payload.gameId;
		}

		dto.answerCount = payload.answerCount;
		dto.outputLanguage = payload.outputLanguage;

		return dto;
	}
}
