import {
	ERROR_CODES,
	ERROR_MESSAGES,
	GROQ_PROVIDER_NAME,
	LLM_PARSER,
	LLMResponseStatus,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { TriviaAnswer } from '@shared/types';
import { isRecord } from '@shared/utils';

import type { LLMResponse, LLMTriviaResponse, TriviaLLMJsonPayload } from '@internal/types';
import { createValidationError } from '@internal/utils';

export class GroqResponseParser {
	constructor(private readonly providerName: string = GROQ_PROVIDER_NAME) {}

	parseResponse(response: LLMResponse, expectedAnswerCount: number): LLMTriviaResponse {
		const data = response.data;
		if (!data?.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
			throw createValidationError(ERROR_MESSAGES.provider.INVALID_GROQ_RESPONSE, 'string');
		}
		const firstChoice = data.choices[0];
		if (firstChoice == null) {
			throw createValidationError(ERROR_MESSAGES.provider.INVALID_GROQ_RESPONSE, 'string');
		}
		const content = firstChoice.message.content;
		return this.parseLLMContentToTriviaResponse(content, expectedAnswerCount);
	}

	parseLLMContentToTriviaResponse(content: string, expectedAnswerCount: number): LLMTriviaResponse {
		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			throw createValidationError(`${this.providerName} ${ERROR_CODES.RESPONSE_CONTENT_EMPTY}`, 'string');
		}

		const { normalizedContent, replacements } = this.normalizeContentQuotes(content);
		const payload = this.parseAndValidatePayload(normalizedContent, expectedAnswerCount);
		const validationSummary = this.buildValidationSummary(payload, expectedAnswerCount, replacements);

		if (payload.question.length === 0) {
			return {
				questions: [],
				explanation: ERROR_MESSAGES.provider.UNABLE_TO_GENERATE_QUESTION,
				content: normalizedContent,
				status: LLMResponseStatus.ERROR,
				validationSummary,
			};
		}

		const triviaAnswers: TriviaAnswer[] = payload.answers.map((answer, index) => ({
			text: answer,
			isCorrect: index === 0, // First answer is correct by default (will be shuffled later)
		}));

		return {
			questions: [
				{
					question: payload.question,
					answers: triviaAnswers,
				},
			],
			content: normalizedContent,
			status: LLMResponseStatus.SUCCESS,
			validationSummary,
		};
	}

	private parseAndValidatePayload(content: string, expectedAnswerCount: number): TriviaLLMJsonPayload {
		let parsed: Record<string, unknown>;
		try {
			const result = JSON.parse(content);
			parsed = isRecord(result) ? result : {};
		} catch {
			throw createValidationError(`${this.providerName} response is not valid JSON`, 'string');
		}

		// Extract only the relevant fields (question, answers) and ignore extraneous fields
		const question = this.sanitizeQuestion(parsed.question);
		const answers = this.sanitizeAnswers(parsed.answers, expectedAnswerCount, question.length === 0);

		if (question.length === 0 && answers.length > 0) {
			throw createValidationError(`${this.providerName} ${ERROR_CODES.INVALID_QUESTION_FORMAT}`, 'string');
		}

		return {
			question,
			answers,
		};
	}

	private sanitizeQuestion(value: unknown): string {
		if (typeof value !== 'string') {
			throw createValidationError(`${this.providerName} question must be a string`, 'string');
		}

		const normalized = this.normalizeAsciiQuotes(value).trim();
		if (normalized.length === 0) {
			return '';
		}

		if (!normalized.endsWith('?')) {
			throw createValidationError(`${this.providerName} question must end with '?'`, 'string');
		}

		if (normalized.length > VALIDATION_LENGTH.QUESTION.PARSER_MAX) {
			throw createValidationError(
				`${this.providerName} question exceeds ${VALIDATION_LENGTH.QUESTION.PARSER_MAX} characters`,
				'string'
			);
		}

		return normalized;
	}

	private sanitizeAnswers(value: unknown, expectedAnswerCount: number, allowEmpty: boolean): string[] {
		if (!Array.isArray(value)) {
			throw createValidationError(`${this.providerName} answers must be an array`, 'string[]');
		}

		const sanitized = value.map(answer => this.sanitizeAnswerString(answer));

		if (allowEmpty) {
			if (sanitized.length !== 0) {
				throw createValidationError(`${this.providerName} failure payload must not include answers`, 'string[]');
			}
			return [];
		}

		// Validate answer count matches expected count
		if (sanitized.length !== expectedAnswerCount) {
			const errorMessage = `${this.providerName} answers must contain exactly ${expectedAnswerCount} items, but received ${sanitized.length} items`;
			throw createValidationError(errorMessage, 'string[]');
		}

		if (new Set(sanitized.map(answer => answer.toLowerCase())).size !== sanitized.length) {
			throw createValidationError(`${this.providerName} answers must be unique`, 'string[]');
		}

		return sanitized;
	}

	private sanitizeAnswerString(value: unknown): string {
		if (typeof value !== 'string') {
			throw createValidationError(`${this.providerName} answer must be a string`, 'string');
		}

		const normalized = this.normalizeAsciiQuotes(value).trim();
		if (normalized.length === 0) {
			throw createValidationError(`${this.providerName} answer cannot be empty`, 'string');
		}

		if (normalized.length > VALIDATION_LENGTH.ANSWER.PARSER_MAX) {
			throw createValidationError(
				`${this.providerName} answer exceeds ${VALIDATION_LENGTH.ANSWER.PARSER_MAX} characters`,
				'string'
			);
		}

		return normalized;
	}

	// The parser, not the prompt, owns ASCII normalization so downstream systems stay deterministic.
	private normalizeContentQuotes(content: string): {
		normalizedContent: string;
		replacements: number;
	} {
		let replacements = 0;
		const normalizedContent = content.replace(LLM_PARSER.SMART_DOUBLE_QUOTES_REGEX, () => {
			replacements += 1;
			return '"';
		});
		return { normalizedContent, replacements };
	}

	private normalizeAsciiQuotes(value: string): string {
		return value.replace(LLM_PARSER.SMART_DOUBLE_QUOTES_REGEX, '"');
	}

	private buildValidationSummary(
		payload: TriviaLLMJsonPayload,
		expectedAnswerCount: number,
		quoteReplacements: number
	): string {
		return `validated:question=${payload.question ? 'ok' : 'empty'},answers=${payload.answers.length}/${expectedAnswerCount},quotesFixed=${quoteReplacements}`;
	}
}
