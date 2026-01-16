import { InputHTMLAttributes, ReactNode, type ComponentProps } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { ClientValidationType } from '@shared/constants';
import type { LanguageValidationOptions, SelectOption } from '@shared/types';

import { FormFieldType, InteractiveSize } from '@/constants';
import type { ValidationHookOptions } from '@/types';

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

export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
	validationType?: ClientValidationType;
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

export type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

export interface FormItemContextValue {
	id: string;
}

export interface NumberInputProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

export type BaseFormFieldErrors<T extends Record<string, string> = Record<string, string>> = {
	[K in keyof T]?: string;
};

export interface PasswordFieldErrors extends BaseFormFieldErrors {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
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
