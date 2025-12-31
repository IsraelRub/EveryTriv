/**
 * Form field constants for client
 *
 * @module FormConstants
 * @description Predefined form field configurations for consistent form layouts
 * @used_by client/src/views/registration, client/src/components/forms
 */
import { ClientValidationType, DifficultyLevel } from '@shared/constants';
import type { FormField } from '@/types';

/**
 * Form field type enum
 * @enum {string} FormFieldType
 * @description Input types used in form fields
 */
export enum FormFieldType {
	TEXT = 'text',
	EMAIL = 'email',
	PASSWORD = 'password',
	TEXTAREA = 'textarea',
	SELECT = 'select',
}

/**
 * Registration form field configurations
 * @constant
 * @description Predefined form fields for user registration
 * @used_by client/src/views/registration
 */
export const REGISTRATION_FIELDS: FormField[] = [
	{
		name: 'email',
		label: 'Email',
		type: FormFieldType.EMAIL,
		validationType: ClientValidationType.EMAIL,
		required: true,
		placeholder: 'Enter your email',
	},
	{
		name: 'password',
		label: 'Password',
		type: FormFieldType.PASSWORD,
		validationType: ClientValidationType.PASSWORD,
		required: true,
		placeholder: 'Enter your password',
	},
	{
		name: 'confirmPassword',
		label: 'Confirm Password',
		type: FormFieldType.PASSWORD,
		validationType: ClientValidationType.PASSWORD,
		required: true,
		placeholder: 'Confirm your password',
	},
];

/**
 * Default form values for registration
 * @constant
 * @description Initial values for registration form
 * @used_by client/src/views/registration
 */
export const REGISTRATION_DEFAULT_VALUES = {
	email: '',
	password: '',
	confirmPassword: '',
	difficulty: DifficultyLevel.MEDIUM,
} as const;
