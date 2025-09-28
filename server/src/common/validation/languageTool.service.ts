import { Injectable } from '@nestjs/common';
import {
	LANGUAGE_TOOL_CONSTANTS,
	LanguageToolConfig,
	LanguageToolResponse,
	LanguageValidationOptions,
 serverLogger as logger,	SupportedLanguage,
	VALIDATION_ERROR_MESSAGES,
	getErrorMessage,
	getErrorStack } from '@shared';

// import type { LanguageToolServiceInterface } from '../types'; // Reserved for future use

@Injectable()
export class LanguageToolService {
	private readonly config: LanguageToolConfig;

	constructor() {
		this.config = {
			baseUrl: LANGUAGE_TOOL_CONSTANTS.BASE_URL,
			apiKey: process.env.LANGUAGE_TOOL_API_KEY,
			timeout: LANGUAGE_TOOL_CONSTANTS.TIMEOUT,
			maxRetries: LANGUAGE_TOOL_CONSTANTS.MAX_RETRIES,
		};

		logger.languageToolServiceInit({
			baseUrl: this.config.baseUrl,
			hasApiKey: !!this.config.apiKey,
			timeout: this.config.timeout || 5000,
			maxRetries: this.config.maxRetries || 3,
		});
	}

	/**
	 * Check text using LanguageTool API
	 */
	async checkText(text: string, options: LanguageValidationOptions = {}): Promise<LanguageToolResponse> {
		const {
			language = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.AUTO,
			enableSpellCheck = true,
			enableGrammarCheck = true,
			preferredVariants,
		} = options;

		try {
			logger.languageToolDebug(`Starting text validation`, {
				textLength: text.length,
				language,
				enableSpellCheck,
				enableGrammarCheck,
				hasPreferredVariants: !!preferredVariants,
			});

			const params = new URLSearchParams({
				text: text,
				language: language,
				enableOnly: this.buildEnableOnlyParam(enableSpellCheck, enableGrammarCheck),
			});

			if (preferredVariants) {
				params.append('preferredVariants', preferredVariants);
			}

			const url = `${this.config.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK}?${params.toString()}`;
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			if (this.config.apiKey) {
				headers['Authorization'] = `ApiKey ${this.config.apiKey}`;
			}

			logger.languageToolApiRequest(url.replace(this.config.apiKey || '', '[REDACTED]'), language, {
				headers: Object.keys(headers),
			});

			const response = await fetch(url, {
				method: 'POST',
				headers,
			});

			if (!response.ok) {
				const errorMessage = `${VALIDATION_ERROR_MESSAGES.LANGUAGETOOL_API_ERROR}: ${response.status} ${response.statusText}`;
				logger.languageToolApiError(response.status, response.statusText, {
					url: url.replace(this.config.apiKey || '', '[REDACTED]'),
				});
				throw new Error(errorMessage);
			}

			const result: LanguageToolResponse = await response.json();

			logger.languageToolValidation(text.length, language, result.matches.length, {
				enableSpellCheck,
				enableGrammarCheck,
			});

			return result;
		} catch (error) {
			const errorMessage = `LanguageTool API error: ${getErrorMessage(error)}`;
			logger.languageToolError(errorMessage, {
				language,
				textLength: text.length,
				error: getErrorStack(error),
			});
			throw error;
		}
	}

	/**
	 * Build enableOnly parameter for LanguageTool API
	 */
	private buildEnableOnlyParam(enableSpellCheck: boolean, enableGrammarCheck: boolean): string {
		const rules: string[] = [];

		if (enableSpellCheck) {
			rules.push(LANGUAGE_TOOL_CONSTANTS.RULES.SPELLING);
		}

		if (enableGrammarCheck) {
			rules.push(
				LANGUAGE_TOOL_CONSTANTS.RULES.GRAMMAR,
				LANGUAGE_TOOL_CONSTANTS.RULES.STYLE,
				LANGUAGE_TOOL_CONSTANTS.RULES.TYPOS
			);
		}

		logger.languageToolDebug(`Built enableOnly parameter`, {
			enableSpellCheck,
			enableGrammarCheck,
			rulesCount: rules.length,
			rules: rules,
		});

		return rules.join(',');
	}

	/**
	 * Get supported languages from LanguageTool
	 */
	async getSupportedLanguages(): Promise<SupportedLanguage[]> {
		try {
			logger.languageToolInfo('Fetching supported languages');

			const response = await fetch(`${this.config.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.LANGUAGES}`);

			if (!response.ok) {
				const errorMessage = `${VALIDATION_ERROR_MESSAGES.FAILED_TO_FETCH_LANGUAGES}: ${response.status}`;
				logger.languageToolApiError(response.status, response.statusText);
				throw new Error(errorMessage);
			}

			const languages = await response.json();
			const supportedLanguages = languages.map((lang: { name: string; longCode?: string; code: string }) => ({
				name: lang.name,
				code: lang.longCode || lang.code,
			}));

			logger.languageToolLanguagesFetched(supportedLanguages.length, {
				languages: supportedLanguages.map((lang: SupportedLanguage) => lang.name),
			});

			return supportedLanguages;
		} catch (error) {
			const errorMessage = `Failed to get supported languages: ${getErrorMessage(error)}`;
			logger.languageToolError(errorMessage, {
				error: getErrorStack(error),
			});

			// Return basic languages as fallback
			const fallbackLanguages = [
				{ name: 'English', code: LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH },
				{ name: 'Hebrew', code: LANGUAGE_TOOL_CONSTANTS.LANGUAGES.HEBREW },
				{ name: 'Spanish', code: LANGUAGE_TOOL_CONSTANTS.LANGUAGES.SPANISH },
				{ name: 'French', code: LANGUAGE_TOOL_CONSTANTS.LANGUAGES.FRENCH },
				{ name: 'German', code: LANGUAGE_TOOL_CONSTANTS.LANGUAGES.GERMAN },
			];

			logger.languageToolFallbackLanguages(fallbackLanguages.length, {
				languages: fallbackLanguages.map((lang: SupportedLanguage) => lang.name),
			});

			return fallbackLanguages;
		}
	}

	/**
	 * Check if LanguageTool service is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			logger.languageToolDebug('Checking service availability');

			const response = await fetch(`${this.config.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'text=sample&language=en',
			});

			const isAvailable = response.ok;

			logger.languageToolAvailabilityCheck(isAvailable, response.status, {
				statusText: response.statusText,
			});

			return isAvailable;
		} catch (error) {
			logger.languageToolError('Service availability check failed', {
				error: getErrorMessage(error),
			});
			return false;
		}
	}
}
