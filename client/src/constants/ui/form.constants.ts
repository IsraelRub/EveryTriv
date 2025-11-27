/**
 * Form field constants for client
 *
 * @module FormConstants
 * @description Predefined form field configurations for consistent form layouts
 * @used_by client/src/views/registration, client/src/components/forms
 */
import { DifficultyLevel, FORM_FIELD_TYPES, FORM_VALIDATION_TYPES } from '@shared/constants';

import type { FormField } from '../../types';

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
		type: FORM_FIELD_TYPES.EMAIL,
		validationType: FORM_VALIDATION_TYPES.EMAIL,
		required: true,
		placeholder: 'Enter your email',
	},
	{
		name: 'password',
		label: 'Password',
		type: FORM_FIELD_TYPES.PASSWORD,
		validationType: FORM_VALIDATION_TYPES.PASSWORD,
		required: true,
		placeholder: 'Enter your password',
	},
	{
		name: 'confirmPassword',
		label: 'Confirm Password',
		type: FORM_FIELD_TYPES.PASSWORD,
		validationType: FORM_VALIDATION_TYPES.PASSWORD,
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
	favoriteTopics: [],
	agreeToTerms: false,
} as const;
