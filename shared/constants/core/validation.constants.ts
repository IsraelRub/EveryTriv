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


/**
 * Validation length limits (string length constraints)
 * @description Length validation limits used across the application
 * @used_by server/src/features/game, server/src/features/credits, shared/validation/core/validation.ts
 */
export const VALIDATION_LENGTH = {
	PASSWORD: {
		MIN: 6,
		MAX: 15,
	},
	EMAIL: {
		MAX: 255,
	},
	TOPIC: {
		MIN: 2,
		MAX: 100,
	},
	CUSTOM_DIFFICULTY: {
		MIN: 3,
		MAX: 200,
	},
	FIRST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	LAST_NAME: {
		MIN: 1,
		MAX: 50,
	},
	QUESTION: {
		MIN: 10,
		MAX: 500,
	},
	ANSWER: {
		MAX: 200, // Maximum length for both trivia answers and game user answers
	},
	REASON: {
		MAX: 200,
	},
	ROOM_CODE: {
		LENGTH: 8, // Room ID/code length (short alphanumeric identifier)
	},
	// String truncation limits (for logs and responses)
	STRING_TRUNCATION: {
		SHORT: 50, // Short string limit (for logs)
	},
	PAYMENT_INTENT_ID: {
		MIN: 1,
		MAX: 100,
	},
} as const;

/**
 * Validation quantity limits (numeric constraints)
 * @description Quantity validation limits used across the application
 * @used_by server/src/features/game, server/src/features/credits, shared/validation/core/validation.ts
 */
export const VALIDATION_COUNT = {
	TIME_LIMIT: {
		MIN: 30,
		MAX: 300,
		STEP: 30,
	},
	PLAYERS: {
		MIN: 2,
		MAX: 4,
	},
	QUESTIONS: {
		MIN: 1,
		MAX: 10, // Maximum questions per request (matches server processing limit)
		STEP: 5,
		UNLIMITED: -1,
	},
	ANSWER_COUNT: {
		MIN: 3,
		MAX: 5,
		STEP: 1,
		DEFAULT: 4,
	},
	CREDITS: {
		MIN: 1,
		MAX: 10000,
	},
	LEADERBOARD: {
		MIN: 1,
		MAX: 100,
		DEFAULT: 50,
	},
	AVATAR_ID: {
		MIN: 1,
		MAX: 16,
	},
} as const;

/**
 * Language validation thresholds (percentages/ratios)
 * @description Thresholds for language quality validation (percentages of words)
 * @used_by shared/validation/core/language.validation.ts
 */
export const LANGUAGE_VALIDATION_THRESHOLDS = {
	EXCESSIVE_PUNCTUATION: 0.3, // 30% of words
	EXCESSIVE_CAPITALIZATION: 0.2, // 20% of words
} as const;

/**
 * Default type guard validators for runtime type checking
 * @description Type guard functions for validating primitive types (string, number, boolean, date)
 * Used for validating values from storage, cache, API responses, and other runtime data sources
 * @used_by client/src/services/infrastructure, server/src/internal/modules/storage, server/src/internal/modules/cache
 */
export const defaultValidators = {
	string: (value: unknown): value is string => typeof value === 'string',
	number: (value: unknown): value is number => typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
	/**
	 * Type guard for date values (Date object or valid ISO date string)
	 * @description Validates that a value is either a valid Date object or a valid date string
	 * Note: This returns `value is Date | string` because JSON serialization converts Date objects to strings
	 */
	date: (value: unknown): value is Date | string =>
		(value instanceof Date && !Number.isNaN(value.getTime())) ||
		(typeof value === 'string' && !Number.isNaN(Date.parse(value))),
} as const;
