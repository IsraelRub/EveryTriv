export interface Position {
	start: number;
	end: number;
}

export interface BaseValidationResult {
	isValid: boolean;
	errors: string[];
	warnings?: string[];
}

export interface PasswordValidationResult extends BaseValidationResult {
	checks: {
		hasMinLength: boolean;
	};
}

export interface ValidationResult extends BaseValidationResult {
	suggestion?: string;
	position?: Position;
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
}

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
