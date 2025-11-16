/**
 * Language validation types
 *
 * @module language.types
 * @description TypeScript interfaces for language validation and LanguageTool API
 */

import { BaseValidationResult } from './domain';

export interface LanguageToolError {
	message: string;
	shortMessage: string;
	replacements: { value: string }[];
	offset: number;
	length: number;
	rule: {
		id: string;
		description: string;
		category: {
			id: string;
			name: string;
		};
	};
}

export interface LanguageToolResponse {
	software: {
		name: string;
		version: string;
		buildDate: string;
		apiVersion: number;
		status: string;
	};
	warnings: {
		incompleteResults: boolean;
	};
	language: {
		name: string;
		code: string;
		detectedLanguage: {
			name: string;
			code: string;
			confidence: number;
		};
	};
	matches: LanguageToolError[];
}

export interface LanguageValidationOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
}

export interface LanguageValidationResult extends BaseValidationResult {
	suggestions: string[];
	confidence?: number;
}

export interface LanguageToolConfig {
	baseUrl: string;
	apiKey?: string;
	timeout?: number;
	maxRetries?: number;
}

/**
 * Language validation request interface
 * @interface ValidateLanguageRequest
 * @description Request payload for language validation
 * @used_by client/src/services/api.service.ts
 */
export interface ValidateLanguageRequest {
	text: string;
	options?: LanguageValidationOptions;
}
