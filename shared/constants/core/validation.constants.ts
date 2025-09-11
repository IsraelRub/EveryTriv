/**
 * Shared validation constants for EveryTriv
 * Used by both client and server
 *
 * @module SharedValidationConstants
 * @description Input validation and error message constants
 * @used_by server: server/src/common/validation/input-validation.service.ts (validation rules), client: client/src/components/user/CompleteProfile.tsx (form validation), shared/validation/validation.utils.ts (validation patterns)
 */

// Debounce delays for different validation types
export const VALIDATION_DEBOUNCE_DELAYS = {
	QUICK: 150,
	STANDARD: 300,
	LANGUAGE_CHECK: 500,
	ASYNC_VALIDATION: 1000,
} as const;

// Validation hook configuration
export const VALIDATION_HOOK_CONFIG = {
	DEFAULT_DEBOUNCE_MS: 300,
	DEFAULT_VALIDATE_ON_MOUNT: false,
	DEFAULT_REQUIRED: false,
} as const;

// Validation error categories
export enum ValidationErrorCategory {
	GRAMMAR = 'GRAMMAR',
	SPELLING = 'TYPOS',
	STYLE = 'STYLE',
	PUNCTUATION = 'PUNCTUATION',
	TYPOGRAPHY = 'TYPOGRAPHY',
	FORMAT = 'FORMAT',
	LENGTH = 'LENGTH',
	REQUIRED = 'REQUIRED',
	PATTERN = 'PATTERN',
}

// Validation limits for input fields
export const VALIDATION_LIMITS = {
	USERNAME: {
		MIN_LENGTH: 3,
		MAX_LENGTH: 30,
	},
	PASSWORD: {
		MIN_LENGTH: 8,
		MAX_LENGTH: 128,
	},
	EMAIL: {
		MAX_LENGTH: 255,
	},
	TOPIC: {
		MIN_LENGTH: 2,
		MAX_LENGTH: 100,
	},
	CUSTOM_DIFFICULTY: {
		MIN_LENGTH: 3,
		MAX_LENGTH: 200,
	},
	FIRST_NAME: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 50,
	},
	LAST_NAME: {
		MIN_LENGTH: 1,
		MAX_LENGTH: 50,
	},
	PHONE: {
		MIN_LENGTH: 9,
		MAX_LENGTH: 15,
	},
	QUESTION_COUNT: {
		MIN: 1,
		MAX: 10,
	},
	POINTS: {
		MIN: 1,
		MAX: 10000,
	},
	REASON: {
		MAX_LENGTH: 200,
	},
	LEADERBOARD_LIMIT: {
		MIN: 1,
		MAX: 100,
	},
} as const;

/**
 * Form field validation types
 * @constant
 * @description Validation types used in form fields
 * @used_by client/src/constants/form.constants.ts, client/src/components/forms/ValidatedInput.tsx
 */
export const FORM_VALIDATION_TYPES = {
	USERNAME: 'username',
	PASSWORD: 'password',
	EMAIL: 'email',
	TOPIC: 'topic',
	CUSTOM_DIFFICULTY: 'customDifficulty',
} as const;

/**
 * Form field types
 * @constant
 * @description Input types used in form fields
 * @used_by client/src/constants/form.constants.ts, client/src/components/forms/ValidatedInput.tsx
 */
export const FORM_FIELD_TYPES = {
	TEXT: 'text',
	EMAIL: 'email',
	PASSWORD: 'password',
	TEXTAREA: 'textarea',
	SELECT: 'select',
} as const;

/**
 * UI size variants
 * @constant
 * @description Common size variants used across UI components
 * @used_by client/src/constants/ui.constants.ts, client/src/components/ui/Button.tsx
 */
export const UI_SIZE_VARIANTS = {
	SM: 'sm',
	MD: 'md',
	LG: 'lg',
	XL: 'xl',
} as const;

/**
 * UI theme variants
 * @constant
 * @description Theme variants used across UI components
 * @used_by client/src/constants/ui.constants.ts, client/src/components/ui/Button.tsx
 */
export const UI_THEME_VARIANTS = {
	LIGHT: 'light',
	DARK: 'dark',
	AUTO: 'auto',
} as const;

/**
 * Audio categories
 * @constant
 * @description Audio categories used across the application
 * @used_by client/src/constants/audio.constants.ts, client/src/services/audio.service.ts
 */
export const AUDIO_CATEGORIES = {
	MUSIC: 'music',
	SFX: 'sfx',
	VOICE: 'voice',
	AMBIENT: 'ambient',
} as const;

// Validation thresholds for text analysis
export const VALIDATION_THRESHOLDS = {
	EXCESSIVE_PUNCTUATION: 0.3, // 30% of words
	EXCESSIVE_CAPITALIZATION: 0.2, // 20% of words
} as const;
