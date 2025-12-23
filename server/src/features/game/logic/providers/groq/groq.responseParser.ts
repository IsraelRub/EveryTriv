/**
 * Groq Response Parser
 * Parser for Groq API responses
 */
import { ERROR_CODES, ERROR_MESSAGES } from '@shared/constants';

import { LLMResponseStatus } from '@internal/constants';
import type { LLMResponse, LLMTriviaResponse, TriviaLLMJsonPayload } from '@internal/types';
import { createValidationError } from '@internal/utils';

/**
 * Groq Response Parser
 * Handles parsing of Groq API responses
 */
export class GroqResponseParser {
	constructor(private readonly providerName: string = 'Groq') {}

	/**
	 * Parse LLM response to trivia response format
	 */
	parseResponse(response: LLMResponse, expectedAnswerCount: number): LLMTriviaResponse {
		const data = response.data;
		if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
			throw createValidationError(ERROR_MESSAGES.provider.INVALID_GROQ_RESPONSE, 'string');
		}
		const content = data.choices[0].message.content;
		return this.parseLLMContentToTriviaResponse(content, expectedAnswerCount);
	}

	/**
	 * Parse LLM content string to LLMTriviaResponse format
	 */
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

		return {
			questions: [
				{
					question: payload.question,
					answers: payload.answers,
					correctAnswerIndex: 0,
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
			if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
				parsed = result;
			} else {
				parsed = {};
			}
		} catch {
			throw createValidationError(`${this.providerName} response is not valid JSON`, 'string');
		}

		const extraneousKeys = Object.keys(parsed).filter(key => !ALLOWED_KEYS.has(key));
		if (extraneousKeys.length > 0) {
			throw createValidationError(
				`${this.providerName} response contains unsupported fields: ${extraneousKeys.join(', ')}`,
				'string'
			);
		}

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

		if (normalized.length > MAX_QUESTION_LENGTH) {
			throw createValidationError(`${this.providerName} question exceeds ${MAX_QUESTION_LENGTH} characters`, 'string');
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

		if (sanitized.length !== expectedAnswerCount) {
			throw createValidationError(
				`${this.providerName} answers must contain exactly ${expectedAnswerCount} items`,
				'string[]'
			);
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

		if (normalized.length > MAX_ANSWER_LENGTH) {
			throw createValidationError(`${this.providerName} answer exceeds ${MAX_ANSWER_LENGTH} characters`, 'string');
		}

		return normalized;
	}

	private normalizeContentQuotes(content: string): { normalizedContent: string; replacements: number } {
		let replacements = 0;
		const normalizedContent = content.replace(SMART_DOUBLE_QUOTES_REGEX, () => {
			replacements += 1;
			return '"';
		});
		return { normalizedContent, replacements };
	}

	private normalizeAsciiQuotes(value: string): string {
		return value.replace(SMART_DOUBLE_QUOTES_REGEX, '"');
	}

	private buildValidationSummary(
		payload: TriviaLLMJsonPayload,
		expectedAnswerCount: number,
		quoteReplacements: number
	): string {
		return `validated:question=${payload.question ? 'ok' : 'empty'},answers=${payload.answers.length}/${expectedAnswerCount},quotesFixed=${quoteReplacements}`;
	}
}

const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 100;
const SMART_DOUBLE_QUOTES_REGEX = /[“”„‟«»＂]/g;
const ALLOWED_KEYS = new Set(['question', 'answers']);
