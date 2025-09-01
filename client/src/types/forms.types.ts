/**
 * Form-related types for client
 * @module ClientFormTypes
 * @used_by client/src/components/forms/**
 */
import type { ValidationHookOptions, ValidationType } from 'everytriv-shared/types';

export interface FormField {
	/** Field name */
	name: string;
	/** Field label */
	label: string;
	/** Field type */
	type: 'text' | 'email' | 'password' | 'textarea' | 'select';
	/** Validation type */
	validationType: ValidationType;
	/** Whether field is required */
	required?: boolean;
	/** Placeholder text */
	placeholder?: string;
	/** Select options (for select type) */
	options?: Array<{ value: string; label: string }>;
	/** Custom validation options */
	validationOptions?: ValidationHookOptions;
}

export interface ValidatedFormProps<T extends Record<string, unknown>> {
	/** Form fields configuration */
	fields: FormField[];
	/** Initial form values */
	initialValues?: T;
	/** Form title */
	title?: string;
	/** Form description */
	description?: string;
	/** Submit button text */
	submitText?: string;
	/** Loading state */
	loading?: boolean;
	/** Validation options */
	validationOptions?: ValidationHookOptions;
	/** Form submission handler */
	onSubmit: (values: T, isValid: boolean) => void | Promise<void>;
	/** Cancel handler */
	onCancel?: () => void;
	/** Additional CSS classes */
	className?: string;
	/** Whether to apply glass effect */
	isGlassy?: boolean;
	/** Whether to show validation summary */
	showValidationSummary?: boolean;
}
