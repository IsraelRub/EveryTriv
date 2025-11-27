/**
 * Validation-related types for EveryTriv
 * Shared between client and server
 *
 * @module ValidationTypes
 * @description Validation interfaces and data structures with enhanced type safety
 */
import { BaseData } from '../core/data.types';

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
export type ValidationSeverity = 'error' | 'warning' | 'info';

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
 * Validation status types
 */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning' | 'pending' | 'none';

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
