import { URLSearchParams } from 'url';

import { Injectable } from '@nestjs/common';

import { CACHE_TTL, LANGUAGE_TOOL_CONSTANTS, VALIDATION_ERROR_MESSAGES } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { LanguageToolConfig, LanguageToolResponse, LanguageValidationOptions } from '@shared/types';
import { getErrorMessage, getErrorStack } from '@shared/utils';

import { createServerError } from '@internal/utils';

// import type { LanguageToolServiceInterface } from '../types'; // Reserved for future use

@Injectable()
export class LanguageToolService {
	private readonly config: LanguageToolConfig;
	private readonly cache: Map<string, { expiresAt: number; result: LanguageToolResponse }> = new Map();
	private readonly cacheTtlMs: number = CACHE_TTL.LONG;

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
			timeout: this.config.timeout ?? 5000,
			maxRetries: this.config.maxRetries ?? 3,
		});
	}

	/**
	 * Check text using LanguageTool API
	 */
	async checkText(text: string, options: LanguageValidationOptions = {}): Promise<LanguageToolResponse> {
		const { enableSpellCheck = true, enableGrammarCheck = true } = options;

		const language = 'en';

		try {
			const cacheKey = this.buildCacheKey(text, language, enableSpellCheck, enableGrammarCheck);
			const cached = this.cache.get(cacheKey);
			if (cached && cached.expiresAt > Date.now()) {
				logger.languageToolDebug('Returning cached LanguageTool response', { textLength: text.length });
				return cached.result;
			}
			logger.languageToolDebug(`Starting text validation`, {
				textLength: text.length,
				enableSpellCheck,
				enableGrammarCheck,
			});

			const params = new URLSearchParams({
				text: text,
				language: language,
				enableOnly: this.buildEnableOnlyParam(enableSpellCheck, enableGrammarCheck),
			});

			const url = `${this.config.baseUrl}${LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK}?${params.toString()}`;
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			if (this.config.apiKey) {
				headers['Authorization'] = `ApiKey ${this.config.apiKey}`;
			}

			logger.languageToolApiRequest(url.replace(this.config.apiKey || '', '[REDACTED]'), 'en', {
				headers: Object.keys(headers),
			});

			const response = await globalThis.fetch(url, {
				method: 'POST',
				headers,
			});

			if (!response.ok) {
				const errorMessage = `${VALIDATION_ERROR_MESSAGES.LANGUAGETOOL_API_ERROR}: ${response.status} ${response.statusText}`;
				logger.languageToolApiError(response.status, response.statusText, {
					url: url.replace(this.config.apiKey || '', '[REDACTED]'),
				});
				throw createServerError('validate text with LanguageTool', new Error(errorMessage));
			}

			const result: LanguageToolResponse = await response.json();

			logger.languageToolValidation(text.length, language, result.matches.length, {
				enableSpellCheck,
				enableGrammarCheck,
			});

			// cache
			this.cache.set(cacheKey, { expiresAt: Date.now() + this.cacheTtlMs, result });
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

	private buildCacheKey(
		text: string,
		language: string,
		enableSpellCheck: boolean,
		enableGrammarCheck: boolean
	): string {
		return [language, enableSpellCheck ? 's1' : 's0', enableGrammarCheck ? 'g1' : 'g0', text].join('|').slice(0, 2048);
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
