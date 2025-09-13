/**
 * Validation-related types for EveryTriv
 * Shared between client and server
 *
 * @module ValidationTypes
 * @description Validation interfaces and data structures with enhanced type safety
 */
import { BasicValue, RequestData } from '../../core/data.types';

/**
 * Validation configuration interface
 * @interface ValidationConfig
 * @description Configuration for validation middleware
 */
export interface ValidationConfig {
	/** Whether to validate request body */
	validateBody?: boolean;
	/** Whether to validate query parameters */
	validateQuery?: boolean;
	/** Whether to validate path parameters */
	validateParams?: boolean;
	/** Custom validation rules */
	customRules?: Record<string, BasicValue>;
	/** Body validation rules */
	body?: ValidationRule[];
	/** Stop on first error */
	stopOnFirstError?: boolean;
}

/**
 * Position information for UI highlighting
 * @interface Position
 * @description Represents a position range in text
 */
export interface Position {
	/** Start position */
	start: number;
	/** End position */
	end: number;
}

/**
 * Base validation result interface
 */
export interface BaseValidationResult {
	/** Whether the validation passed */
	isValid: boolean;
	/** Array of validation error messages */
	errors: string[];
	/** Optional warnings that don't fail validation */
	warnings?: string[];
}

/**
 * Field-specific validation result
 */
export interface FieldValidationResult extends BaseValidationResult {
	/** Field name being validated */
	field: string;
	/** Current field value */
	value: string;
	/** Whether field is required */
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
	/** Password strength level */
	strength: PasswordStrength;
	/** Strength score (0-100) */
	score: number;
	/** Specific validation checks */
	checks: {
		/** Has minimum length */
		hasMinLength: boolean;
		/** Has uppercase letter */
		hasUppercase: boolean;
		/** Has lowercase letter */
		hasLowercase: boolean;
		/** Has number */
		hasNumber: boolean;
		/** Has special character */
		hasSpecialChar: boolean;
	};
}

/**
 * Validation result interface for form and data validation
 * @interface ValidationResult
 * @description Represents the result of data validation operations
 * @used_by server: server/src/common/validation/input-validation.service.ts (validateInput), client: client/src/components/user/CompleteProfile.tsx (form validation), shared/validation/validation.utils.ts (validateInputWithLanguageTool)
 */
export interface ValidationResult extends BaseValidationResult {
	/** Suggestion for fixing validation errors */
	suggestion?: string;
	/** Position information for UI highlighting */
	position?: Position;
}

/**
 * Validation error with position information
 */
export interface ValidationError {
	/** Error message */
	message: string;
	/** Error code for internationalization */
	code: string;
	/** Field name where error occurred */
	field?: string;
	/** Character position where error occurred */
	position?: {
		start: number;
		end: number;
	};
	/** Error severity level */
	severity: 'error' | 'warning' | 'info';
}

/**
 * Validation context for providing additional information
 */
export interface ValidationContext {
	/** Current user ID if available */
	userId?: string;
	/** Current session data */
	session?: RequestData;
	/** Validation options */
	options?: {
		/** Whether to perform strict validation */
		strict?: boolean;
		/** Whether to include warnings */
		includeWarnings?: boolean;
		/** Custom validation rules */
		customRules?: RequestData;
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
	/** Rule name */
	name: string;
	/** Field name to validate */
	field: string;
	/** Rule description */
	description?: string;
	/** Error message template */
	errorMessage?: string;
	/** Whether rule is required */
	required: boolean;
	/** Rule priority (lower = higher priority) */
	priority: number;
	/** Validation function */
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
 * Validation options for decorators and interceptors
 */
export interface ValidationOptions {
	/** Schema name for validation */
	schema?: string;
	/** Whether to transform data */
	transform?: boolean;
	/** Whether to strip unknown properties */
	stripUnknown?: boolean;
	/** Custom error message */
	errorMessage?: string;
	/** Whether to sanitize inputs */
	sanitizeInputs?: boolean;
	/** Whether to validate inputs */
	validateInputs?: boolean;
	/** Whether to log validation failures */
	logFailures?: boolean;
	/** Fields to exclude from validation */
	excludeFields?: string[];
	/** Custom validation rules */
	customRules?: Record<string, ValidationFunction>;
	[key: string]: unknown;
}

/**
 * Validation options interface for decorators
 * @interface ValidationOptions
 * @description Options for validation decorators with error handling and transformation settings
 */
export interface ValidationDecoratorOptions {
	/** Error message to display */
	errorMessage?: string;
	/** Whether to strip unknown properties */
	stripUnknown?: boolean;
	/** Whether to transform the data */
	transform?: boolean;
}

/**
 * Validation interceptor options
 */
export interface ValidationInterceptorOptions {
	/** Whether to sanitize inputs */
	sanitizeInputs?: boolean;
	/** Whether to validate inputs */
	validateInputs?: boolean;
	/** Whether to log validation failures */
	logFailures?: boolean;
	/** Fields to exclude from validation */
	excludeFields?: string[];
	/** Custom validation rules */
	customRules?: Record<string, ValidationFunction>;
}

/**
 * Validation result for interceptor
 */
export interface ValidationInterceptorResult {
	/** Whether validation passed */
	isValid: boolean;
	/** Validation error message */
	error?: string;
	/** Validation warnings */
	warnings?: string[];
	/** Field name */
	field?: string;
	/** Data type */
	dataType?: RequestDataType;
}

/**
 * Validation middleware configuration
 */
export interface ValidationMiddlewareConfig {
	/** Body validation rules */
	body?: ValidationRule[];
	/** Query parameter validation rules */
	query?: ValidationRule[];
	/** Path parameter validation rules */
	params?: ValidationRule[];
	/** Whether to stop on first error */
	stopOnFirstError?: boolean;
	/** Custom error handler */
	errorHandler?: (errors: ValidationError[]) => void;
}

/**
 * Custom difficulty validation response interface
 * @interface CustomDifficultyValidationResponse
 * @description Response for custom difficulty validation
 * @used_by client/src/services/api.service.ts (validateCustomDifficulty)
 */
export interface CustomDifficultyValidationResponse {
	/** Whether the custom difficulty is valid */
	isValid: boolean;
	/** Validation errors if any */
	errors?: string[];
}

/**
 * Custom difficulty validation request interface
 * @interface ValidateCustomDifficultyRequest
 * @description Request payload for custom difficulty validation
 * @used_by client/src/services/api.service.ts (validateCustomDifficulty)
 */
export interface ValidateCustomDifficultyRequest extends Record<string, BasicValue> {
	/** Custom difficulty text to validate */
	customText: string;
}

// ============================================================================
// DOMAIN-SPECIFIC VALIDATION TYPES
// ============================================================================

/**
 * Interface for difficulty validation results
 * @interface DifficultyValidation
 * @description Structure for difficulty validation results including detected level
 * @used_by shared/validation/difficulty.validation.ts (validateCustomDifficultyText)
 */
export interface DifficultyValidation {
	isValid: boolean;
	error?: string;
	detectedLevel?: 'elementary' | 'high_school' | 'university' | 'expert';
}

/**
 * Interface for trivia input validation results
 * @interface SharedTriviaInputValidation
 * @description Structure for validation results across topic, difficulty, and overall validation
 * @used_by shared/validation/trivia.validation.ts (validateTriviaInputQuick)
 */
export interface SharedTriviaInputValidation {
	topic: {
		isValid: boolean;
		errors: string[];
	};
	difficulty: {
		isValid: boolean;
		errors: string[];
	};
	overall: {
		isValid: boolean;
		canProceed: boolean;
	};
}

/**
 * Extended validation result for payment validation with warnings
 * @interface PaymentValidationResult
 * @description Payment validation result that includes warnings in addition to errors
 * @used_by shared/validation/payment.validation.ts (validatePaymentAmount)
 */
export interface PaymentValidationResult {
	/** Whether the validation passed */
	isValid: boolean;
	/** Array of validation error messages */
	errors: string[];
	/** Optional warnings that don't fail validation */
	warnings?: string[];
}

/**
 * Extended validation result for points validation with warnings
 * @interface PointsValidationResult
 * @description Points validation result that includes warnings in addition to errors
 * @used_by shared/validation/points.validation.ts (validatePointBalance, validatePointPurchase, etc.)
 */
export interface PointsValidationResult {
	/** Whether the validation passed */
	isValid: boolean;
	/** Array of validation error messages */
	errors: string[];
	/** Optional warnings that don't fail validation */
	warnings?: string[];
}

// ============================================================================
// PIPE VALIDATION TYPES
// ============================================================================

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
 * Trivia Question Validation Result
 * @interface TriviaQuestionValidationResult
 * @description Result of trivia question validation
 */
export interface TriviaQuestionValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
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
 * Game Answer Validation Result
 * @interface GameAnswerValidationResult
 * @description Result of game answer validation
 */
export interface GameAnswerValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
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
 * Language Validation Result - imported from language.types.ts
 * @interface LanguageValidationResult
 * @description Result of language validation
 */
export type { LanguageValidationResult } from '../../language.types';

/**
 * Custom Difficulty Validation Result
 * @interface CustomDifficultyValidationResult
 * @description Result of custom difficulty validation
 */
export interface CustomDifficultyValidationResult {
	isValid: boolean;
	errors: string[];
	suggestion?: string;
	success: boolean;
	timestamp: string;
}

/**
 * Payment Data Validation Result
 * @interface PaymentDataValidationResult
 * @description Result of payment data validation
 */
export interface PaymentDataValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
}

/**
 * User Data Validation Result
 * @interface UserDataValidationResult
 * @description Result of user data validation
 */
export interface UserDataValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
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
 * Trivia Request Validation Result
 * @interface TriviaRequestValidationResult
 * @description Result of trivia request validation
 */
export interface TriviaRequestValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
}
