import { InputHTMLAttributes, type ComponentProps, type ReactElement, type TextareaHTMLAttributes } from 'react';

import { ClientValidationType } from '@shared/constants';

import { FormFieldType } from '@/constants';
import type { LanguageValidationOptions, ValidationHookOptions } from '../core';

export interface FormField {
	name: string;
	label: string;
	type: FormFieldType;
	validationType: ClientValidationType;
	required?: boolean;
	placeholder?: string;
	options?: SelectOption[];
	validationOptions?: ValidationHookOptions;
}

export type InputProps = ComponentProps<'input'> & { error?: boolean };

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
	error?: boolean;
};

export interface NumberInputProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'className'> {
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;

	error?: boolean;
	label?: string;
	labelIcon?: ReactElement | null;
}

export interface RegistrationFieldErrors extends BaseFormFieldErrors {
	email?: string;
	password?: string;
	confirmPassword?: string;
}

export interface LoginFieldErrors extends BaseFormFieldErrors {
	email?: string;
	password?: string;
}

export interface ProfileFieldErrors extends BaseFormFieldErrors {
	firstName?: string;
	lastName?: string;
}
export interface SelectOption {
	value: string;
	label: string;
}

export interface ValidatedFormProps<T extends Record<string, string>> {
	fields: FormField[];
	initialValues?: T;
	title?: string;
	description?: string;
	submitText?: string;
	isLoading?: boolean;
	validationOptions?: ValidationHookOptions;
	onSubmit: (values: T, isValid: boolean) => void | Promise<void>;
	onCancel?: () => void;
	className?: string;
	isGlassy?: boolean;
	showValidationSummary?: boolean;
}

export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	validationType?: ClientValidationType;
	initialValue?: string;
	validationOptions?:
		| ValidationHookOptions
		| Pick<LanguageValidationOptions, 'enableSpellCheck' | 'enableGrammarCheck'>;
	onChange?: (value: string, isValid: boolean) => void;
	showValidationIcon?: boolean;
	showErrors?: boolean;
	renderError?: (error: string) => ReactElement | string | null;
	isGlassy?: boolean;
	className?: string;
}

export type BaseFormFieldErrors<T extends Record<string, string> = Record<string, string>> = {
	[K in keyof T]?: string;
};

export interface PasswordFieldErrors extends BaseFormFieldErrors {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
}
