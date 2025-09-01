/**
 * Validation-related types for EveryTriv
 * Shared between client and server
 *
 * @module ValidationTypes
 * @description Validation interfaces and data structures with enhanced type safety
 */
import { RequestData } from './data.types';

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
 * Validation schema type
 */
export interface ValidationSchema {
	/** Schema name */
	name: string;
	/** Schema version */
	version: string;
	/** Field validations */
	fields: Record<string, ValidationRule[]>;
	/** Cross-field validations */
	crossFieldValidations?: ValidationRule[];
}

/**
 * Real-time validation options
 */
export interface RealTimeValidationOptions {
	/** Debounce delay in milliseconds */
	debounceMs: number;
	/** Whether to validate on mount */
	validateOnMount: boolean;
	/** Whether field is required */
	required: boolean;
	/** Custom validation rules */
	customRules?: ValidationRule[];
}

/**
 * Validation result interface for hooks
 */
export interface ValidationHookResult {
	isValid: boolean;
	errors: string[];
	isValidating: boolean;
	value: string;
	validate: (value: string) => void;
	clearValidation: () => void;
}

/**
 * Options for validation hooks
 */
export interface ValidationHookOptions {
	debounceMs?: number;
	validateOnMount?: boolean;
	required?: boolean;
}

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
}

/**
 * Base form validation result interface
 */
export interface BaseFormValidationResult {
	/** Whether form is valid */
	isValid: boolean;
	/** Whether validation is in progress */
	isValidating: boolean;
	/** Validate all fields */
	validateAll: () => boolean;
	/** Reset form to initial state */
	reset: () => void;
}

/**
 * Form validation result type for typed forms
 */
export interface FormValidationResult<T extends Record<string, unknown>> extends BaseFormValidationResult {
	/** Form values */
	values: T;
	/** Field errors */
	errors: Record<keyof T, string[]>;
	/** Set field value and validate */
	setFieldValue: (field: keyof T, value: string) => void;
	/** Validate specific field */
	validateField: (field: keyof T, value: string) => void;
	/** Set all form values */
	setValues: (values: T) => void;
}

/**
 * String-based form validation result type
 */
export interface StringFormValidationResult extends BaseFormValidationResult {
	/** Form values as strings */
	values: Record<string, string>;
	/** Field errors */
	errors: Record<string, string[]>;
	/** Set field value and validate */
	setFieldValue: (field: string, value: string) => void;
	/** Validate specific field */
	validateField: (field: string, value: string) => void;
	/** Set all form values */
	setValues: (values: Record<string, string>) => void;
}

// Re-export ValidationErrorCategory from constants
export { ValidationErrorCategory } from '../constants';

/**
 * Validation status types
 */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';

/**
 * Validation type for form fields
 */
export type ValidationType = 'username' | 'password' | 'email' | 'topic' | 'customDifficulty';

/**
 * Validation component props
 */
export interface ValidationIconProps {
	/** Validation status */
	status: ValidationStatus;
	/** Icon size */
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/** Whether to show animation */
	animated?: boolean;
	/** Custom className */
	className?: string;
	/** Custom icon name override */
	iconName?: string;
	/** Tooltip text */
	tooltip?: string;
	/** Whether to show tooltip */
	showTooltip?: boolean;
}

export interface ValidationStatusIndicatorProps {
	/** Current validation status */
	status: ValidationStatus;
	/** Previous status for transition effects */
	previousStatus?: ValidationStatus;
	/** Size variant */
	size?: 'sm' | 'md' | 'lg';
	/** Whether to show transition animations */
	showTransitions?: boolean;
	/** Custom className */
	className?: string;
}

export interface ValidationMessageProps {
	/** Validation status */
	status: ValidationStatus;
	/** Error messages */
	errors?: string[];
	/** Warning messages */
	warnings?: string[];
	/** Success message */
	successMessage?: string;
	/** Whether to show icon */
	showIcon?: boolean;
	/** Whether to show messages */
	showMessages?: boolean;
	/** Custom className */
	className?: string;
	/** Size variant */
	size?: 'sm' | 'md' | 'lg';
	/** Animation duration */
	animationDuration?: number;
}

/**
 * Request data type for validation
 */
export type RequestDataType = 'body' | 'query' | 'params';

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
export interface ValidateCustomDifficultyRequest extends Record<string, unknown> {
	/** Custom difficulty text to validate */
	customText: string;
}
