import { Injectable } from '@nestjs/common';

import {
	COMMON_MISSPELLINGS,
	ERROR_MESSAGES,
	ErrorCode,
	GRAMMAR_PATTERNS,
	HttpMethod,
	LANGUAGE_TOOL_CONSTANTS,
	LANGUAGE_VALIDATION_THRESHOLDS,
	Locale,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type { LanguageValidationResult } from '@shared/types';
import { delay, getErrorMessage, isNonEmptyString } from '@shared/utils';
import { isPredominantlyHebrewText, matchesLocaleText, VALIDATORS } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type { LanguageToolCheckOptions, LanguageToolResponse } from '@internal/types';
import { createServerError } from '@internal/utils';

class LanguageToolClientError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number
	) {
		super(message);
		this.name = 'LanguageToolClientError';
		Object.setPrototypeOf(this, LanguageToolClientError.prototype);
	}
}

@Injectable()
export class LanguageToolService {
	private readonly baseUrl: string;
	private readonly timeout: number;
	private readonly maxRetries: number;
	private isAvailableCache: boolean | null = null;
	private availabilityCheckTime: number = 0;
	private readonly availabilityCacheTTL = TIME_PERIODS_MS.FIVE_MINUTES;

	constructor() {
		this.baseUrl = LANGUAGE_TOOL_CONSTANTS.BASE_URL;
		this.timeout = LANGUAGE_TOOL_CONSTANTS.TIMEOUT;
		this.maxRetries = LANGUAGE_TOOL_CONSTANTS.MAX_RETRIES;
	}

	private async isAvailable(): Promise<boolean> {
		const now = Date.now();
		// Use cached availability if still valid
		if (this.isAvailableCache !== null && now - this.availabilityCheckTime < this.availabilityCacheTTL) {
			return this.isAvailableCache;
		}

		try {
			logger.languageToolAvailabilityCheck(false, 0, { checking: true });
			const response = await fetch(this.baseUrl + LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.LANGUAGES, {
				method: HttpMethod.GET,
				signal: AbortSignal.timeout(this.timeout),
			});

			const isAvailable = response.ok;
			this.isAvailableCache = isAvailable;
			this.availabilityCheckTime = now;

			logger.languageToolAvailabilityCheck(isAvailable, response.status);
			return isAvailable;
		} catch (error) {
			logger.languageToolError(`Availability check failed: ${getErrorMessage(error)}`);
			this.isAvailableCache = false;
			this.availabilityCheckTime = now;
			return false;
		}
	}

	async checkText(text: string, options: LanguageToolCheckOptions = {}): Promise<LanguageValidationResult> {
		const {
			useExternalAPI = true,
			detectLanguage = false,
			language = detectLanguage ? 'auto' : LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH,
		} = options;

		// Validate input
		if (!isNonEmptyString(text)) {
			throw new Error(ErrorCode.LANGUAGETOOL_VALIDATION_REQUIRES_TEXT);
		}

		const trimmedLength = text.trim().length;
		if (useExternalAPI && trimmedLength < LANGUAGE_TOOL_CONSTANTS.MIN_TEXT_LENGTH_FOR_API) {
			return this.performLocalLanguageValidation(text, {
				enableSpellCheck: options.enableSpellCheck ?? true,
				enableGrammarCheck: options.enableGrammarCheck ?? true,
			});
		}

		// Try external API if enabled and available
		if (useExternalAPI) {
			try {
				const isAvailable = await this.isAvailable();
				if (isAvailable) {
					return await this.checkTextWithAPI(text, language, options);
				}
			} catch (error) {
				logger.languageToolError(`API check failed, falling back to local validation: ${getErrorMessage(error)}`);
			}
		}

		// Fallback to local validation
		return this.performLocalLanguageValidation(text, {
			enableSpellCheck: options.enableSpellCheck ?? true,
			enableGrammarCheck: options.enableGrammarCheck ?? true,
		});
	}

	private async checkTextWithAPI(
		text: string,
		language: string,
		options: LanguageToolCheckOptions = {}
	): Promise<LanguageValidationResult> {
		const url = this.baseUrl + LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK;
		const apiKey = process.env.LANGUAGE_TOOL_API_KEY;

		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				logger.languageToolApiRequest(url, HttpMethod.POST, { attempt, textLength: text.length });

				const headers: HeadersInit = {
					'Content-Type': 'application/x-www-form-urlencoded',
				};

				if (apiKey) {
					headers['Authorization'] = `Bearer ${apiKey}`;
				}

				const body = new URLSearchParams({
					text,
					language,
					enabledOnly: 'false',
					level: 'default',
				});

				const response = await fetch(url, {
					method: HttpMethod.POST,
					headers,
					body: body.toString(),
					signal: AbortSignal.timeout(this.timeout),
				});

				if (!response.ok) {
					const errorMessage = `LanguageTool API returned ${response.status}: ${response.statusText}`;
					logger.languageToolApiError(response.status, response.statusText, {
						attempt,
						textLength: text.length,
					});

					const clientError = new LanguageToolClientError(errorMessage, response.status);

					if (response.status >= 400 && response.status < 500) {
						throw clientError;
					}

					if (response.status >= 500 && attempt < this.maxRetries) {
						lastError = clientError;
						await delay(attempt * TIME_PERIODS_MS.SECOND);
						continue;
					}

					throw clientError;
				}

				const data: LanguageToolResponse = await response.json();

				// Convert API response to LanguageValidationResult
				const errors: string[] = [];
				const suggestions: string[] = [];

				// When using language=auto, API returns match messages in the detected language (e.g. Polish, Spanish).
				// Show a single English message so the user always sees English, not e.g. "Wykryto błąd pisowni".
				const useEnglishMessageOnly = options.detectLanguage;

				for (const match of data.matches) {
					if (useEnglishMessageOnly) {
						if (errors.length === 0) {
							errors.push(ERROR_MESSAGES.validation.SPELLING_OR_GRAMMAR_ISSUE);
						}
					} else {
						errors.push(match.message || match.shortMessage || 'Language issue detected');
					}
					if (match.replacements && match.replacements.length > 0) {
						suggestions.push(...match.replacements.map(r => r.value));
					}
				}

				// When language detection was requested, add "Please enter in English" if detected language is not English
				// API returns locale codes (e.g. en-US, en-GB), so treat any code starting with 'en' as English
				if (options.detectLanguage && data.language?.detectedLanguage?.code) {
					const detectedCode = data.language.detectedLanguage.code;
					const confidence = data.language.detectedLanguage.confidence ?? 0;
					const isEnglish = detectedCode.startsWith('en');
					if (!isEnglish && confidence >= LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW) {
						errors.push(ERROR_MESSAGES.validation.ENTER_IN_ENGLISH);
					}
				}

				logger.languageToolValidation(text.length, language, data.matches.length, {
					errorsCount: errors.length,
					suggestionsCount: suggestions.length,
				});

				return {
					isValid: errors.length === 0,
					errors,
					suggestions,
					confidence:
						errors.length === 0 ? LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.HIGH : LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.MEDIUM,
				};
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(getErrorMessage(error));
				const statusCode = lastError instanceof LanguageToolClientError ? lastError.statusCode : undefined;

				if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
					throw lastError;
				}

				if (attempt < this.maxRetries) {
					logger.languageToolDebug(`Retrying API call (attempt ${attempt}/${this.maxRetries})`, {
						error: getErrorMessage(lastError),
					});
					await delay(attempt * TIME_PERIODS_MS.SECOND);
				}
			}
		}

		throw createServerError('check text with LanguageTool API', lastError ?? new Error('Unknown error'));
	}

	private performLocalLanguageValidation(
		input: string,
		options: {
			enableSpellCheck: boolean;
			enableGrammarCheck: boolean;
		}
	): LanguageValidationResult {
		const { enableSpellCheck, enableGrammarCheck } = options;

		try {
			if (!isNonEmptyString(input)) {
				return {
					isValid: false,
					errors: ['Input cannot be empty'],
					suggestions: [],
				};
			}

			const errors: string[] = [];
			const suggestions: string[] = [];

			if (enableSpellCheck) {
				const words = input.toLowerCase().split(/\s+/);

				for (const word of words) {
					const cleanWord = word.replace(/[^\w]/g, '');
					const misspellingEntry = Object.entries(COMMON_MISSPELLINGS).find(([key]) => key === cleanWord);
					if (misspellingEntry) {
						const wordSuggestions = misspellingEntry[1];
						const suggestionsForWord = Array.isArray(wordSuggestions) ? wordSuggestions : [wordSuggestions];
						errors.push(`Possible misspelling: "${word}"`);
						suggestions.push(
							...suggestionsForWord
								.filter((suggestion): suggestion is string => VALIDATORS.string(suggestion))
								.map((suggestion: string) => `Did you mean "${suggestion}"?`)
						);
					}
				}
			}

			if (enableGrammarCheck) {
				for (const issue of GRAMMAR_PATTERNS) {
					if (issue.pattern.test(input)) {
						errors.push('Grammar issue detected');
						suggestions.push(issue.suggestion);
					}
				}
			}

			const localChecks = this.performLocalChecks(input);
			errors.push(...localChecks.errors);
			suggestions.push(...localChecks.suggestions);

			return {
				isValid: errors.length === 0,
				errors,
				suggestions,
				confidence: LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW,
			};
		} catch (error) {
			logger.languageToolError(`Local language validation failed: ${getErrorMessage(error)}`, {
				customText: input,
			});
			return {
				isValid: false,
				errors: ['Language validation service is currently experiencing technical difficulties'],
				suggestions: ['Please try again in a few moments, or contact support if the issue persists'],
			};
		}
	}

	private performLocalChecks(input: string): { errors: string[]; suggestions: string[] } {
		const errors: string[] = [];
		const suggestions: string[] = [];
		const predominantlyHebrew = isPredominantlyHebrewText(input);
		const words = input.split(/\s+/);

		for (let i = 0; i < words.length - 1; i++) {
			const currentWord = words[i];
			const nextWord = words[i + 1];
			if (currentWord != null && nextWord != null && currentWord.toLowerCase() === nextWord.toLowerCase()) {
				errors.push('Repeated word detected');
				suggestions.push('Consider removing the repeated word');
				break;
			}
		}

		const punctuationCount = (input.match(/[.!?]/g) ?? []).length;
		if (punctuationCount > words.length * LANGUAGE_VALIDATION_THRESHOLDS.EXCESSIVE_PUNCTUATION) {
			errors.push('Excessive punctuation detected');
			suggestions.push('Consider reducing the number of punctuation marks');
		}

		const wordsWithLatinCaps = words.filter(
			word => word.length > 1 && /[a-zA-Z]/.test(word) && word === word.toUpperCase()
		);
		if (
			words.length > 0 &&
			wordsWithLatinCaps.length > words.length * LANGUAGE_VALIDATION_THRESHOLDS.EXCESSIVE_CAPITALIZATION
		) {
			errors.push('Excessive capitalization detected');
			suggestions.push('Consider using normal capitalization');
		}

		const veryShortWords = words.filter(word => word.length === 1 && /[a-zA-Z]/.test(word));
		if (veryShortWords.length > 0) {
			errors.push('Single character words detected');
			suggestions.push('Consider expanding single character words');
		}

		const nonWhitespace = input.replace(/\s/g, '');
		if (nonWhitespace.length > 0 && !predominantlyHebrew && !matchesLocaleText(input, Locale.EN)) {
			errors.push(ERROR_MESSAGES.validation.ENTER_IN_ENGLISH);
			suggestions.push(ERROR_MESSAGES.validation.ENTER_IN_ENGLISH);
		}

		return { errors, suggestions };
	}
}
