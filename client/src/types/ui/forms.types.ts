/**
 * Form Types
 * @module FormTypes
 * @description Form-related types and interfaces
 */
import { InputHTMLAttributes, ReactNode, type ComponentProps } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { ClientValidationType } from '@shared/constants';
import type { LanguageValidationOptions } from '@shared/types';
import { FormFieldType, InteractiveSize } from '@/constants';
import type { SelectOption, ValidationHookOptions } from '@/types';

// Form-related types
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

// ValidatedInputProps interface
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

/**
 * Form field context value type
 * @type FormFieldContextValue
 * @description Context value for form field
 */
export type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

/**
 * Form item context value interface
 * @interface FormItemContextValue
 * @description Context value for form item
 */
export interface FormItemContextValue {
	id: string;
}

/**
 * Number input component props
 * @interface NumberInputProps
 * @description Props for the NumberInput component
 * @used_by client/src/components/ui/numberInput.tsx
 */
export interface NumberInputProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
}

/**
 * Password field errors interface
 * @interface PasswordFieldErrors
 * @description Error messages for password-related form fields
 * @used_by client/src/components/user/ProfileEditDialog.tsx
 */
export interface PasswordFieldErrors {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
}
