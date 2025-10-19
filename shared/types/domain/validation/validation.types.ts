/**
 * Validation-related types for EveryTriv
 * Shared between client and server
 *
 * @module ValidationTypes
 * @description Validation interfaces and data structures with enhanced type safety
 */
import { BasicValue, BaseData } from '../../core/data.types';

/**
 * Validation configuration interface
 * @interface ValidationConfig
 * @description Configuration for validation middleware
 */
export interface ValidationConfig {
	readonly validateBody?: boolean;
	readonly validateQuery?: boolean;
	readonly validateParams?: boolean;
	readonly customRules?: Record<string, BasicValue>;
	readonly body?: ValidationRule[];
	readonly stopOnFirstError?: boolean;
}

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
export interface SimpleValidationResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Base validation result interface
 * @interface BaseValidationResult
 * @description Extended validation result with optional warnings
 */
export interface BaseValidationResult extends SimpleValidationResult {
	warnings?: string[];
}

/**
 * Field-specific validation result
 */
export interface FieldValidationResult extends BaseValidationResult {
	field: string;
	value: string;
	required: boolean;
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Password validation result interface
 */
export interface PasswordValidationResult extends BaseValidationResult {
	strength: PasswordStrength;
	score: number;
	checks: {
		hasMinLength: boolean;
		hasUppercase: boolean;
		hasLowercase: boolean;
		hasNumber: boolean;
		hasSpecialChar: boolean;
	};
}

/**
 * Validation result interface for form and data validation
 * @interface ValidationResult
 * @description Validation result with additional context
 */
export interface ValidationResult extends SimpleValidationResult {
	suggestion?: string;
	position?: Position;
	warnings?: string[];
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
	severity: 'error' | 'warning' | 'info';
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
 * Validation function type
 */
export type ValidationFunction<T = string> = (
	value: T,
	context?: ValidationContext
) => BaseValidationResult | Promise<BaseValidationResult>;

/**
 * Async validation function type
 */
export type AsyncValidationFunction<T = string> = (
	value: T,
	context?: ValidationContext
) => Promise<BaseValidationResult>;

/**
 * Validation rule definition
 */
export interface ValidationRule {
	name: string;
	field: string;
	description?: string;
	errorMessage?: string;
	required: boolean;
	priority: number;
	validator: ValidationFunction;
}

/**
 * Validation type for form fields
 */
export type ValidationType =
	| 'username'
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
 * Request data type for validation
 */
export type RequestDataType = 'body' | 'query' | 'params';

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

	// Custom rules
	customRules?: Record<string, ValidationFunction>;

	// Additional options
	[key: string]: unknown;
}

/**
 * @deprecated Use ValidationOptions instead
 */
export type ValidationDecoratorOptions = Pick<ValidationOptions, 'errorMessage' | 'stripUnknown' | 'transform'>;

/**
 * @deprecated Use ValidationOptions instead
 */
export type ValidationInterceptorOptions = Pick<
	ValidationOptions,
	'sanitizeInputs' | 'validateInputs' | 'logFailures' | 'excludeFields' | 'customRules'
>;

/**
 * Validation result for interceptor
 */
export interface ValidationInterceptorResult extends ValidationResultWithWarnings {
	field?: string;
	dataType?: RequestDataType;
}

/**
 * Validation middleware configuration
 */
export interface ValidationMiddlewareConfig {
	body?: ValidationRule[];
	query?: ValidationRule[];
	params?: ValidationRule[];
	stopOnFirstError?: boolean;
	errorHandler?: (errors: ValidationError[]) => void;
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
 * Interface for difficulty validation results
 * @interface DifficultyValidation
 * @description Difficulty validation results with detected level
 */
export interface DifficultyValidation extends SimpleValidationResult {
	detectedLevel?: 'elementary' | 'high_school' | 'university' | 'expert';
}

/**
 * Interface for trivia input validation results
 * @interface SharedTriviaInputValidation
 * @description Validation results across topic, difficulty, and overall validation
 */
export interface SharedTriviaInputValidation {
	topic: SimpleValidationResult;
	difficulty: SimpleValidationResult;
	overall: {
		isValid: boolean;
		canProceed: boolean;
	};
}

/**
 * Extended validation result with warnings
 * @interface ExtendedValidationResult
 * @description Validation result with warnings
 */
export interface ValidationResultWithWarnings extends SimpleValidationResult {
	warnings?: string[];
}

/**
 * Extended pipe validation result with additional data
 * @interface ExtendedPipeValidationResult
 * @description Pipe validation result with additional context
 */
export interface PipeValidationWithSuggestion extends SimpleValidationResult {
	suggestion?: string;
}

/**
 * Trivia Question Data
 * @interface TriviaQuestionData
 * @description Data structure for trivia question validation
 */
export interface TriviaQuestionData {
	question: string;
	options: string[];
	correctAnswer: string;
	difficulty?: string;
	topic?: string;
}

/**
 * Game Answer Data
 * @interface GameAnswerData
 * @description Data structure for game answer validation
 */
export interface GameAnswerData {
	questionId: string;
	answer: string;
	timeSpent: number;
}

/**
 * Language Validation Data
 * @interface LanguageValidationData
 * @description Data structure for language validation
 */
export interface LanguageValidationData {
	text: string;
	language?: string;
	enableSpellCheck?: boolean;
	enableGrammarCheck?: boolean;
}

/**
 * Trivia Request Data
 * @interface TriviaRequestData
 * @description Data structure for trivia request validation
 */
export interface TriviaRequestData {
	topic: string;
	difficulty: string;
	questionCount: number;
}

/**
 * Language Validation Result - imported from language.types.ts
 * @interface LanguageValidationResult
 * @description Result of language validation
 */
export type { LanguageValidationResult } from '../../language.types';

/**
 * @deprecated Use SimpleValidationResult instead (remove success/timestamp)
 */
export interface TriviaRequestValidationResult extends SimpleValidationResult {
	success: boolean;
	timestamp: string;
}
