// Import types from validation.types.ts
import type { ValidationStatus } from './validation.types';

/**
 * Form validation types for EveryTriv
 *
 * @module FormsValidationTypes
 * @description Form validation, field validation, and validation result types
 */

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
	customRules?: Array<{
		name: string;
		field: string;
		validator: (value: string) => { isValid: boolean; errors: string[] };
	}>;
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
