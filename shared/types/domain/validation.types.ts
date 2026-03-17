import type { Locale } from '@shared/constants';

export interface BaseValidationResult {
	isValid: boolean;
	errors: string[];
	warnings?: string[];
}

export interface ValidationResult extends BaseValidationResult {
	suggestion?: string;
	position?: { start: number; end: number };
}

export interface ValidationOptions {
	schema?: string;
	transform?: boolean;
	stripUnknown?: boolean;
	errorMessage?: string;
	logFailures?: boolean;
	sanitizeInputs?: boolean;
	validateInputs?: boolean;
	excludeFields?: string[];
}

export interface CustomDifficultyRequest {
	customText: string;
	language?: Locale;
}

export interface LanguageValidationResult extends BaseValidationResult {
	suggestions: string[];
	confidence?: number;
}
