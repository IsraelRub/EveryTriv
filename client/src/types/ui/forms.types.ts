/**
 * Form Types
 * @module FormTypes
 * @description Form-related types and interfaces
 */
import { InputHTMLAttributes, ReactNode } from 'react';

import type { LanguageValidationOptions, SelectOption, ValidationType } from '@shared/types';

import { InteractiveSize } from '../../constants';
import type { ClientValidationType, ValidationHookOptions } from '../validation.types';

// Form-related types
export interface FormField {
	name: string;
	label: string;
	type: 'text' | 'email' | 'password' | 'textarea' | 'select';
	validationType: ValidationType;
	required?: boolean;
	placeholder?: string;
	options?: SelectOption[];
	validationOptions?: ValidationHookOptions;
}

export interface ValidatedFormProps<T extends Record<string, string>> {
	fields: FormField[];
	initialValues?: T;
	title?: string;
	description?: string;
	submitText?: string;
	loading?: boolean;
	validationOptions?: ValidationHookOptions;
	onSubmit: (values: T, isValid: boolean) => void | Promise<void>;
	onCancel?: () => void;
	className?: string;
	isGlassy?: boolean;
	showValidationSummary?: boolean;
}

// ValidatedInputProps interface
export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	validationType: ClientValidationType;
	initialValue?: string;
	validationOptions?:
		| ValidationHookOptions
		| Pick<LanguageValidationOptions, 'enableSpellCheck' | 'enableGrammarCheck'>;
	onChange?: (value: string, isValid: boolean) => void;
	showValidationIcon?: boolean;
	showErrors?: boolean;
	renderError?: (error: string) => ReactNode;
	isGlassy?: boolean;
	size?: InteractiveSize;
	className?: string;
}
