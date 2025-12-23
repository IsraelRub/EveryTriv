/**
 * Client UI Constants
 * @module ClientUIConstants
 * @description Client-side UI constants
 */

/**
 * Form field types
 * @constant
 * @description Input types used in form fields
 */
export const FORM_FIELD_TYPES = {
	TEXT: 'text',
	EMAIL: 'email',
	PASSWORD: 'password',
	TEXTAREA: 'textarea',
	SELECT: 'select',
} as const;

// Note: FORM_VALIDATION_TYPES removed - use ClientValidationType from @shared/constants instead
// Note: AUDIO_CATEGORIES removed - use AudioCategory enum from audio.constants.ts instead
