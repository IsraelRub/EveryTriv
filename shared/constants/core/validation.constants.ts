/**
 * Shared validation constants for EveryTriv
 * Used by both client and server
 *
 * @module SharedValidationConstants
 * @description Input validation and error message constants
 * @used_by server/src/common/validation, client/src/components/user, shared/validation
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
	PASSWORD: {
		MIN_LENGTH: 6,
		MAX_LENGTH: 15,
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
	QUESTIONS: {
		MIN: 1,
		MAX: 50,
		STEP: 5,
		UNLIMITED: -1,
	},
	ANSWER_COUNT: {
		MIN: 3,
		MAX: 5,
		STEP: 1,
	},
	TIME_LIMIT: {
		MIN: 30,
		MAX: 300,
		STEP: 30,
	},
	CREDITS: {
		MIN: 1,
		MAX: 10000,
	},
	REASON: {
		MAX_LENGTH: 200,
	},
	LEADERBOARD: {
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
 * Client validation type enum
 * @enum ClientValidationType
 * @description Types of validation performed on client side
 */
export enum ClientValidationType {
	EMAIL = 'email',
	PASSWORD = 'password',
	TOPIC = 'topic',
	CUSTOM_DIFFICULTY = 'customDifficulty',
	FIRST_NAME = 'firstName',
	LAST_NAME = 'lastName',
}

/**
 * Validation severity enumeration
 * @enum ValidationSeverity
 * @description Severity levels for validation errors
 */
export enum ValidationSeverity {
	ERROR = 'error',
	WARNING = 'warning',
	INFO = 'info',
}

/**
 * Validation status enumeration
 * @enum ValidationStatus
 * @description Status of validation operations
 */
export enum ValidationStatus {
	IDLE = 'idle',
	VALIDATING = 'validating',
	VALID = 'valid',
	INVALID = 'invalid',
	WARNING = 'warning',
	PENDING = 'pending',
	NONE = 'none',
}

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

/**
 * Validation configuration with limits
 * @constant
 * @description Validation configuration used across the application
 * @used_by server/src/features/game, server/src/features/credits
 */
export const VALIDATION_CONFIG = {
	limits: {
		PASSWORD: {
			MIN_LENGTH: VALIDATION_LIMITS.PASSWORD.MIN_LENGTH,
			MAX_LENGTH: VALIDATION_LIMITS.PASSWORD.MAX_LENGTH,
		},
		EMAIL: {
			MAX_LENGTH: VALIDATION_LIMITS.EMAIL.MAX_LENGTH,
		},
		TOPIC: {
			MIN_LENGTH: VALIDATION_LIMITS.TOPIC.MIN_LENGTH,
			MAX_LENGTH: VALIDATION_LIMITS.TOPIC.MAX_LENGTH,
		},
		FIRST_NAME: {
			MIN_LENGTH: VALIDATION_LIMITS.FIRST_NAME.MIN_LENGTH,
			MAX_LENGTH: VALIDATION_LIMITS.FIRST_NAME.MAX_LENGTH,
		},
		LAST_NAME: {
			MIN_LENGTH: VALIDATION_LIMITS.LAST_NAME.MIN_LENGTH,
			MAX_LENGTH: VALIDATION_LIMITS.LAST_NAME.MAX_LENGTH,
		},
		TIME_LIMIT: {
			MIN: VALIDATION_LIMITS.TIME_LIMIT.MIN,
			MAX: VALIDATION_LIMITS.TIME_LIMIT.MAX,
			STEP: VALIDATION_LIMITS.TIME_LIMIT.STEP,
		},
		TRIVIA_QUESTION: {
			MIN_LENGTH: 10, // Minimum reasonable question length
			MAX_LENGTH: 500, // Maximum reasonable question length
		},
		TRIVIA_ANSWER: {
			MAX_LENGTH: 200, // Maximum answer length
		},
		GAME_ANSWER: {
			MAX_LENGTH: 200, // Maximum game answer length
		},
		PLAYERS: {
			MIN: 2,
			MAX: 4,
		},
		QUESTIONS: {
			MIN: VALIDATION_LIMITS.QUESTIONS.MIN,
			MAX: VALIDATION_LIMITS.QUESTIONS.MAX,
			STEP: VALIDATION_LIMITS.QUESTIONS.STEP,
			UNLIMITED: VALIDATION_LIMITS.QUESTIONS.UNLIMITED,
		},
		ANSWER_COUNT: {
			MIN: VALIDATION_LIMITS.ANSWER_COUNT.MIN,
			MAX: VALIDATION_LIMITS.ANSWER_COUNT.MAX,
			STEP: VALIDATION_LIMITS.ANSWER_COUNT.STEP,
			DEFAULT: 4,
		},
	},
	thresholds: {
		EXCESSIVE_PUNCTUATION: VALIDATION_THRESHOLDS.EXCESSIVE_PUNCTUATION,
		EXCESSIVE_CAPITALIZATION: VALIDATION_THRESHOLDS.EXCESSIVE_CAPITALIZATION,
	},
} as const;
