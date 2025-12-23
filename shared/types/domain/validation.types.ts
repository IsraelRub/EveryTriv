/**
 * Validation-related types for EveryTriv
 * Shared between client and server
 *
 * @module ValidationTypes
 * @description Validation interfaces and data structures with enhanced type safety
 */
import { ValidationSeverity } from '../../constants';
import type { BaseData } from '../core/data.types';

/**
 * Position information for UI highlighting
 * @interface Position
 * @description Represents a position range in text
 */
export interface Position {
	start: number;
	end: number;
}

/**
 * Simple validation result
 * @interface SimpleValidationResult
 * @description Base validation result structure
 */
export interface BaseValidationResult {
	isValid: boolean;
	errors: string[];
	warnings?: string[];
}

/**
 * Password validation result interface
 */
export interface PasswordValidationResult extends BaseValidationResult {
	checks: {
		hasMinLength: boolean;
	};
}

/**
 * Validation result interface for form and data validation
 * @interface ValidationResult
 * @description Validation result with additional context
 */
export interface ValidationResult extends BaseValidationResult {
	suggestion?: string;
	position?: Position;
}

/**
 * Validation error with position information
 */
export interface ValidationError {
	message: string;
	code: string;
	field?: string;
	position?: {
		start: number;
		end: number;
	};
	severity: ValidationSeverity;
}

/**
 * Validation context for providing additional information
 */
export interface ValidationContext {
	userId?: string;
	session?: BaseData;
	options?: {
		strict?: boolean;
		includeWarnings?: boolean;
		customRules?: BaseData;
	};
}

/**
 * Validation type for form fields
 */
export type ValidationType =
	| 'password'
	| 'email'
	| 'topic'
	| 'customDifficulty'
	| 'game_answer'
	| 'user_profile'
	| 'payment_data'
	| 'trivia_question'
	| 'trivia_request'
	| 'language_validation';

/**
 * Unified validation options interface
 * @interface ValidationOptions
 * @description Options for validation decorators, interceptors, and middleware
 */
export interface ValidationOptions {
	// Schema options
	schema?: string;

	// Transformation options
	transform?: boolean;
	stripUnknown?: boolean;

	// Error handling
	errorMessage?: string;
	logFailures?: boolean;

	// Validation behavior
	sanitizeInputs?: boolean;
	validateInputs?: boolean;
	excludeFields?: string[];
}

/**
 * Custom difficulty validation request interface
 * @interface ValidateCustomDifficultyRequest
 * @description Request payload for custom difficulty validation
 * @used_by client/src/services/api.service.ts (validateCustomDifficulty)
 */
export interface CustomDifficultyRequest {
	customText: string;
}

/**
 * Extended pipe validation result with additional data
 * @interface ExtendedPipeValidationResult
 * @description Pipe validation result with additional context
 */
export interface PipeValidationWithSuggestion extends BaseValidationResult {
	suggestion?: string;
}

/**
 * Language validation types
 * @description Types for language validation and LanguageTool API integration
 */

/**
 * Language tool error interface
 * @interface LanguageToolError
 * @description Error structure from LanguageTool API
 */
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

/**
 * Language tool response interface
 * @interface LanguageToolResponse
 * @description Response structure from LanguageTool API
 */
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

/**
 * Language validation options interface
 * @interface LanguageValidationOptions
 * @description Options for language validation
 */
export interface LanguageValidationOptions {
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
	useExternalAPI?: boolean;
}

/**
 * Language validation result interface
 * @interface LanguageValidationResult
 * @description Result of language validation with suggestions
 */
export interface LanguageValidationResult extends BaseValidationResult {
	suggestions: string[];
	confidence?: number;
}

/**
 * Language tool configuration interface
 * @interface LanguageToolConfig
 * @description Configuration for LanguageTool service
 */
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
