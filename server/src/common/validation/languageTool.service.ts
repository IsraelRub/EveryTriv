/**
 * LanguageTool Integration Service
 *
 * @module LanguageToolService
 * @description Provides access to the external LanguageTool API with retries, timeouts, and structured logging
 */
import { Injectable } from '@nestjs/common';

import { ERROR_CODES, HttpMethod, LANGUAGE_TOOL_CONSTANTS } from '@shared/constants';
import { getErrorMessage, isRecord } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import type { LanguageToolCheckOptions, LanguageToolResponse } from '@internal/types';

@Injectable()
export class LanguageToolService {
	private readonly baseUrl: string;
	private readonly apiKey?: string;
	private readonly timeoutMs: number;
	private readonly maxRetries: number;
	private readonly defaultLanguage: string;

	constructor() {
		this.baseUrl = this.normalizeBaseUrl(
			typeof process !== 'undefined' ? process.env.LANGUAGE_TOOL_BASE_URL : undefined
		);
		this.apiKey = this.normalizeOptionalValue(
			typeof process !== 'undefined' ? process.env.LANGUAGE_TOOL_API_KEY : undefined
		);
		this.timeoutMs = this.normalizeNumber(
			typeof process !== 'undefined' ? process.env.LANGUAGE_TOOL_TIMEOUT : undefined,
			LANGUAGE_TOOL_CONSTANTS.TIMEOUT
		);
		this.maxRetries = this.normalizeNumber(
			typeof process !== 'undefined' ? process.env.LANGUAGE_TOOL_MAX_RETRIES : undefined,
			LANGUAGE_TOOL_CONSTANTS.MAX_RETRIES
		);
		this.defaultLanguage = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH;

		logger.languageToolServiceInit({
			baseUrl: this.baseUrl,
			timeout: this.timeoutMs,
			maxRetries: this.maxRetries,
		});
	}

	async isAvailable(): Promise<boolean> {
		const endpoint = LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.LANGUAGES;

		try {
			const response = await this.performRequest(HttpMethod.GET, endpoint);
			logger.languageToolAvailabilityCheck(response.ok, response.status, {
				endpoint,
			});
			return response.ok;
		} catch (error) {
			logger.languageToolError(`Availability check failed: ${getErrorMessage(error)}`, {
				endpoint,
			});
			logger.languageToolAvailabilityCheck(false, 0, {
				endpoint,
			});
			return false;
		}
	}

	async checkText(text: string, options: LanguageToolCheckOptions = {}): Promise<LanguageToolResponse> {
		const trimmedText = text.trim();
		if (trimmedText.length === 0) {
			throw new Error(ERROR_CODES.LANGUAGETOOL_VALIDATION_REQUIRES_TEXT);
		}

		const endpoint = LANGUAGE_TOOL_CONSTANTS.ENDPOINTS.CHECK;
		const params = this.buildCheckParams(text, options);

		try {
			const response = await this.performRequest(HttpMethod.POST, endpoint, params);
			const rawData = await response.json();

			if (!this.isLanguageToolResponse(rawData)) {
				throw new Error(ERROR_CODES.LANGUAGETOOL_UNEXPECTED_RESPONSE);
			}

			logger.languageToolValidation(
				text.length,
				params.get('language') ?? this.defaultLanguage,
				rawData.matches.length,
				{
					endpoint,
				}
			);

			return rawData;
		} catch (error) {
			logger.languageToolError(`LanguageTool validation failed: ${getErrorMessage(error)}`, {
				endpoint,
			});
			throw error;
		}
	}

	private async performRequest(method: HttpMethod, endpoint: string, body?: URLSearchParams): Promise<Response> {
		const url = `${this.baseUrl}${endpoint}`;
		let attempt = 0;
		let lastError: Error | null = null;

		while (attempt <= this.maxRetries) {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

			try {
				logger.languageToolApiRequest(url, method, {
					attempt: attempt + 1,
					maxRetries: this.maxRetries,
				});

				const response = await globalThis.fetch(url, {
					method,
					headers: this.buildHeaders(),
					body,
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					logger.languageToolApiError(response.status, response.statusText, {
						attempt: attempt + 1,
						maxRetries: this.maxRetries,
					});

					if (attempt === this.maxRetries) {
						throw new Error(`LanguageTool API error ${response.status} ${response.statusText} for ${url}`);
					}

					lastError = new Error(`LanguageTool API error ${response.status} ${response.statusText} for ${url}`);
				} else {
					return response;
				}
			} catch (error) {
				clearTimeout(timeoutId);

				const normalizedError = error instanceof Error ? error : new Error(String(error));

				if (normalizedError.name === 'AbortError') {
					lastError = new Error(`LanguageTool request timed out after ${this.timeoutMs}ms for ${url}`);
				} else {
					lastError = normalizedError;
				}

				logger.languageToolDebug(`LanguageTool request error: ${getErrorMessage(lastError)}`, {
					attempt: attempt + 1,
					maxRetries: this.maxRetries,
				});
			} finally {
				clearTimeout(timeoutId);
			}

			attempt += 1;
		}

		throw lastError ?? new Error(`LanguageTool request failed for ${url}`);
	}

	private buildHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': 'EveryTriv-Server/1.0',
		};

		if (this.apiKey) {
			headers.Authorization = `Bearer ${this.apiKey}`;
		}

		return headers;
	}

	private buildCheckParams(text: string, options: LanguageToolCheckOptions): URLSearchParams {
		const params = new URLSearchParams();
		const language = options.language ?? this.defaultLanguage;

		params.set('text', text);
		params.set('language', language);
		params.set('enabledOnly', 'false');

		const disabledCategories: string[] = [];

		if (options.enableGrammarCheck === false) {
			disabledCategories.push(LANGUAGE_TOOL_CONSTANTS.RULES.GRAMMAR);
		}

		if (options.enableSpellCheck === false) {
			disabledCategories.push(LANGUAGE_TOOL_CONSTANTS.RULES.TYPOS);
		}

		if (disabledCategories.length > 0) {
			params.set('disabledCategories', disabledCategories.join(','));
		}

		if (this.apiKey) {
			params.set('apiKey', this.apiKey);
		}

		return params;
	}

	private normalizeBaseUrl(value: string | undefined): string {
		if (!value || value.trim().length === 0) {
			return LANGUAGE_TOOL_CONSTANTS.BASE_URL;
		}

		const trimmed = value.trim();
		return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
	}

	private normalizeOptionalValue(value: string | undefined): string | undefined {
		if (!value) {
			return undefined;
		}

		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}

	private normalizeNumber(value: string | undefined, defaultValue: number): number {
		if (!value) {
			return defaultValue;
		}

		const parsed = Number.parseInt(value, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
	}

	private isLanguageToolResponse(value: unknown): value is LanguageToolResponse {
		if (!isRecord(value)) {
			return false;
		}

		const matches = value.matches;
		if (!Array.isArray(matches)) {
			return false;
		}

		return matches.every(match => this.isLanguageToolMatch(match));
	}

	private isLanguageToolMatch(value: unknown): value is LanguageToolResponse['matches'][number] {
		if (!isRecord(value)) {
			return false;
		}

		const messageValid = typeof value.message === 'string' || typeof value.shortMessage === 'string';
		const replacementsValid =
			Array.isArray(value.replacements) && value.replacements.every(replacement => this.isReplacement(replacement));

		return messageValid && replacementsValid;
	}

	private isReplacement(value: unknown): value is { value: string } {
		if (!isRecord(value)) {
			return false;
		}

		return typeof value.value === 'string';
	}
}
