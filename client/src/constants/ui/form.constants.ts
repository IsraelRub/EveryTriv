/**
 * Form field constants for client
 *
 * @module FormConstants
 * @description Predefined form field configurations for consistent form layouts
 * @used_by client/src/views/registration, client/src/components/forms
 */
import { COUNTRIES, DifficultyLevel } from '@shared/constants';
import {
  FORM_FIELD_TYPES,
  FORM_VALIDATION_TYPES,
} from '@shared/constants/core/validation.constants';

import type { FormField } from '../../types/ui/forms.types';

/**
 * Registration form field configurations
 * @constant
 * @description Predefined form fields for user registration
 * @used_by client/src/views/registration
 */
export const REGISTRATION_FIELDS: FormField[] = [
  {
    name: 'username',
    label: 'Username',
    type: FORM_FIELD_TYPES.TEXT,
    validationType: FORM_VALIDATION_TYPES.USERNAME,
    required: true,
    placeholder: 'Enter your username',
  },
  {
    name: 'email',
    label: 'Email',
    type: FORM_FIELD_TYPES.EMAIL,
    validationType: FORM_VALIDATION_TYPES.EMAIL,
    required: true,
    placeholder: 'Enter your email',
  },
  {
    name: 'address.country',
    label: 'Country',
    type: FORM_FIELD_TYPES.SELECT,
    validationType: FORM_VALIDATION_TYPES.USERNAME,
    required: true,
    placeholder: 'Select your country',
    options: COUNTRIES.map((country: { code: string; name: string; phonePrefix: string }) => ({
      value: country.code,
      label: `${country.name} (${country.phonePrefix})`,
    })),
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
 * Profile update form field configurations
 * @constant
 * @description Predefined form fields for user profile updates
 * @used_by client/src/views/user/ProfileView.tsx
 */
export const PROFILE_FIELDS: FormField[] = [
  {
    name: 'firstName',
    label: 'First Name',
    type: FORM_FIELD_TYPES.TEXT,
    validationType: FORM_VALIDATION_TYPES.USERNAME,
    required: true,
    placeholder: 'Enter your first name',
  },
  {
    name: 'lastName',
    label: 'Last Name',
    type: FORM_FIELD_TYPES.TEXT,
    validationType: FORM_VALIDATION_TYPES.USERNAME,
    required: true,
    placeholder: 'Enter your last name',
  },
  {
    name: 'address.country',
    label: 'Country',
    type: FORM_FIELD_TYPES.SELECT,
    validationType: FORM_VALIDATION_TYPES.USERNAME,
    required: true,
    placeholder: 'Select your country',
    options: COUNTRIES.map((country: { code: string; name: string; phonePrefix: string }) => ({
      value: country.code,
      label: `${country.name} (${country.phonePrefix})`,
    })),
  },
];

/**
 * Default form values for registration
 * @constant
 * @description Initial values for registration form
 * @used_by client/src/views/registration
 */
export const REGISTRATION_DEFAULT_VALUES = {
  username: '',
  email: '',
  address: {
    country: '',
    state: '',
    city: '',
    street: '',
    zipCode: '',
    apartment: '',
  },
  password: '',
  confirmPassword: '',
  phonePrefix: '+1',
  difficulty: DifficultyLevel.MEDIUM,
  favoriteTopics: [],
  agreeToTerms: false,
  agreeToNewsletter: true,
} as const;
