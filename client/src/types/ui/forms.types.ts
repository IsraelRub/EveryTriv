/**
 * Form Types
 * @module FormTypes
 * @description Form-related types and interfaces
 */
import type { ValidationHookOptions, ValidationType } from '@shared';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

// Base input props
export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	/** Input value */
	value: string;
	/** Change handler */
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Input type */
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
	/** Whether input is required */
	required?: boolean;
	/** Whether input is disabled */
	disabled?: boolean;
	/** Input name */
	name?: string;
	/** Input id */
	id?: string;
	/** Additional CSS classes */
	className?: string;
	/** Input size */
	size?: 'sm' | 'md' | 'lg';
	/** Whether input has glass effect */
	isGlassy?: boolean;
	/** Whether input has error */
	error?: boolean;
	/** Whether input has animation */
	withAnimation?: boolean;
}

// Base select props
export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'> {
	/** Select value */
	value: string;
	/** Change handler */
	onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Whether select is required */
	required?: boolean;
	/** Whether select is disabled */
	disabled?: boolean;
	/** Select name */
	name?: string;
	/** Select id */
	id?: string;
	/** Additional CSS classes */
	className?: string;
	/** Select options */
	options?: Array<{ value: string; label: string }>;
	/** Select size */
	size?: 'sm' | 'md' | 'lg';
	/** Whether select has glass effect */
	isGlassy?: boolean;
	/** Whether select has error */
	error?: boolean;
	/** Select children */
	children: React.ReactNode;
}

// Form-related types
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

// Input Props
// Form Input Props (extends base FormInputProps)
export interface FormInputPropsExtended extends FormInputProps {
	/** Form field name */
	fieldName: string;
	/** Form validation */
	validation?: ValidationHookOptions;
}

// Validated Input Props
export interface ValidatedInputProps extends Omit<FormInputProps, 'onChange'> {
	/** Validation type */
	validationType: ValidationType;
	/** Validation options */
	validationOptions?: ValidationHookOptions;
	/** Real-time validation */
	realTimeValidation?: boolean;
	/** Validation debounce delay */
	validationDebounceMs?: number;
	/** Initial value */
	initialValue?: string;
	/** Whether to show errors */
	showErrors?: boolean;
	/** Custom error renderer */
	renderError?: (errors: string[]) => React.ReactNode;
	/** Whether to show validation icon */
	showValidationIcon?: boolean;
	/** Change handler */
	onChange?: (value: string, isValid?: boolean, errors?: string[]) => void;
}

// Form Select Props (extends base FormSelectProps)
export interface FormSelectPropsExtended extends FormSelectProps {
	/** Form field name */
	fieldName: string;
	/** Form validation */
	validation?: ValidationHookOptions;
}

// Select Option
export interface SelectOption {
	/** Option value */
	value: string;
	/** Option label */
	label: string;
	/** Whether option is disabled */
	disabled?: boolean;
}

// Form Field Interface
export interface FormField {
	name: string;
	label: string;
	type: 'text' | 'email' | 'password' | 'select' | 'textarea';
	placeholder?: string;
	required?: boolean;
	defaultValue?: unknown;
	options?: Array<{
		value: string;
		label: string;
	}>;
}