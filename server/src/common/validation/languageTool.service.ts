import { Injectable } from '@nestjs/common';

import { ERROR_CODES, LANGUAGE_TOOL_CONSTANTS } from '@shared/constants';
import type { LanguageValidationResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { performLocalLanguageValidationAsync } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import { createServerError } from '@internal/utils';

export interface LanguageToolCheckOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
	language?: string;
}

export interface LanguageToolResponse {
	matches: Array<{
		message: string;
		shortMessage: string;
		replacements: Array<{ value: string }>;
		rule: {
			id: string;
			description: string;
			category: {
				id: string;
				name: string;
			};
		};
	}>;
}

@Injectable()
export class LanguageToolService {
	private readonly baseUrl: string;
	private readonly timeout: number;
	private readonly maxRetries: number;
	private isAvailableCache: boolean | null = null;
	private availabilityCheckTime: number = 0;
	private readonly availabilityCacheTTL = 5 * 60 * 1000; // 5 minutes

	constructor() {
		this.baseUrl = LANGUAGE_TOOL_CONSTANTS.BASE_URL;
		this.timeout = LANGUAGE_TOOL_CONSTANTS.TIMEOUT;
		this.maxRetries = LANGUAGE_TOOL_CONSTANTS.MAX_RETRIES;
	}

	async isAvailable(): Promise<boolean> {
		const now = Date.now();
		// Use cached availability if still valid
		if (this.isAvailableCache !== null && now - this.availabilityCheckTime < this.availabilityCacheTTL) {
			return this.isAvailableCache;
		}

		try {
			logger.languageToolAvailabilityCheck(false, 0, { checking: true });
			const response = await fetch(`${this.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.LANGUAGES}`, {
				method: 'GET',
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
		const { useExternalAPI = true, language = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH } = options;

		// Validate input
		if (!text || text.trim().length === 0) {
			throw new Error(ERROR_CODES.LANGUAGETOOL_VALIDATION_REQUIRES_TEXT);
		}

		// Try external API if enabled and available
		if (useExternalAPI) {
			try {
				const isAvailable = await this.isAvailable();
				if (isAvailable) {
					return await this.checkTextWithAPI(text, language);
				}
			} catch (error) {
				logger.languageToolError(`API check failed, falling back to local validation: ${getErrorMessage(error)}`);
			}
		}

		// Fallback to local validation
		return await performLocalLanguageValidationAsync(text, {
			enableSpellCheck: options.enableSpellCheck ?? true,
			enableGrammarCheck: options.enableGrammarCheck ?? true,
		});
	}

	private async checkTextWithAPI(text: string, language: string): Promise<LanguageValidationResult> {
		const url = `${this.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK}`;
		const apiKey = process.env.LANGUAGE_TOOL_API_KEY;

		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				logger.languageToolApiRequest(url, 'POST', { attempt, textLength: text.length });

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
					method: 'POST',
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

					if (response.status >= 500 && attempt < this.maxRetries) {
						// Retry on server errors
						lastError = new Error(errorMessage);
						await this.delay(attempt * 1000); // Exponential backoff
						continue;
					}

					throw new Error(errorMessage);
				}

				const data: LanguageToolResponse = await response.json();

				// Convert API response to LanguageValidationResult
				const errors: string[] = [];
				const suggestions: string[] = [];

				for (const match of data.matches) {
					errors.push(match.message || match.shortMessage || 'Language issue detected');
					if (match.replacements && match.replacements.length > 0) {
						suggestions.push(...match.replacements.map(r => r.value));
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

				if (attempt < this.maxRetries) {
					logger.languageToolDebug(`Retrying API call (attempt ${attempt}/${this.maxRetries})`, {
						error: getErrorMessage(lastError),
					});
					await this.delay(attempt * 1000);
				}
			}
		}

		throw createServerError('check text with LanguageTool API', lastError ?? new Error('Unknown error'));
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
