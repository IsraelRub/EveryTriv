/**
 * Language validation types
 *
 * @module language.types
 * @description TypeScript interfaces for language validation and LanguageTool API
 */

export interface LanguageToolError {
	message: string;
	shortMessage: string;
	replacements: Array<{ value: string }>;
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

export interface LanguageValidationOptions extends Record<string, unknown> {
	language?: string;
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	enableLanguageDetection?: boolean;
	preferredVariants?: string;
	useExternalAPI?: boolean;
}

export interface LanguageValidationResult {
	isValid: boolean;
	errors: string[];
	suggestions: string[];
	language?: string;
	confidence?: number;
}

export interface SupportedLanguage {
	name: string;
	code: string;
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
export interface ValidateLanguageRequest extends Record<string, unknown> {
	/** Text to validate */
	text: string;
	/** Validation options */
	options?: LanguageValidationOptions;
}
