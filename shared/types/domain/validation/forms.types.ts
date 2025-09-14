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
	debounceMs: number;
	validateOnMount: boolean;
	required: boolean;
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
	isValid: boolean;
	isValidating: boolean;
	validateAll: () => boolean;
	reset: () => void;
}

/**
 * Form validation result type for typed forms
 */
export interface FormValidationResult<T extends Record<string, unknown>> extends BaseFormValidationResult {
	values: T;
	errors: Record<keyof T, string[]>;
	setFieldValue: (field: keyof T, value: string) => void;
	validateField: (field: keyof T, value: string) => void;
	setValues: (values: T) => void;
}

/**
 * String-based form validation result type
 */
export interface StringFormValidationResult extends BaseFormValidationResult {
	values: Record<string, string>;
	errors: Record<string, string[]>;
	setFieldValue: (field: string, value: string) => void;
	validateField: (field: string, value: string) => void;
	setValues: (values: Record<string, string>) => void;
}

/**
 * Validation component props
 */
export interface ValidationIconProps {
	status: ValidationStatus;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	animated?: boolean;
	className?: string;
	iconName?: string;
	tooltip?: string;
	showTooltip?: boolean;
}

export interface ValidationStatusIndicatorProps {
	status: ValidationStatus;
	previousStatus?: ValidationStatus;
	size?: 'sm' | 'md' | 'lg';
	showTransitions?: boolean;
	className?: string;
}

export interface ValidationMessageProps {
	status: ValidationStatus;
	errors?: string[];
	warnings?: string[];
	successMessage?: string;
	showIcon?: boolean;
	showMessages?: boolean;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	animationDuration?: number;
}
