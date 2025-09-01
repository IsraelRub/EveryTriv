/**
 * JSON Schema validation schemas for EveryTriv
 *
 * @module ValidationSchemas
 * @description JSON Schema definitions for validation rules
 * @used_by client/src/utils/validation.utils.ts, server/src/common/validation/input-validation.service.ts
 */
import { CUSTOM_DIFFICULTY_PREFIX, VALIDATION_LIMITS } from '../constants';

/**
 * Schema name type for type safety
 */
export type SchemaName =
	| 'username'
	| 'password'
	| 'email'
	| 'topic'
	| 'customDifficulty'
	| 'triviaRequest'
	| 'pointsPurchase'
	| 'paymentData'
	| 'analyticsEvent'
	| 'userProfile'
	| 'gameRequest';

/**
 * Base validation schema properties
 */
export const baseValidationSchema = {
	type: 'object',
	additionalProperties: false,
	errorMessage: {
		required: 'This field is required',
		type: 'Invalid data type',
		additionalProperties: 'Unknown field',
	},
} as const;

/**
 * Username validation schema
 */
export const usernameSchema = {
	...baseValidationSchema,
	properties: {
		username: {
			type: 'string',
			minLength: VALIDATION_LIMITS.USERNAME.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.USERNAME.MAX_LENGTH,
			pattern: '^[a-zA-Z0-9_-]+$',
		},
	},
	required: ['username'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			username: {
				minLength: 'Username must be at least 3 characters long',
				maxLength: 'Username must be less than 30 characters',
				pattern: 'Username can only contain letters, numbers, underscores, and hyphens',
			},
		},
	},
} as const;

/**
 * Password validation schema
 */
export const passwordSchema = {
	...baseValidationSchema,
	properties: {
		password: {
			type: 'string',
			minLength: VALIDATION_LIMITS.PASSWORD.MIN_LENGTH,
			pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
		},
	},
	required: ['password'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			password: {
				minLength: 'Password must be at least 8 characters long',
				pattern: 'Password must contain uppercase, lowercase, and number',
			},
		},
	},
} as const;

/**
 * Email validation schema
 */
export const emailSchema = {
	...baseValidationSchema,
	properties: {
		email: {
			type: 'string',
			format: 'email',
			maxLength: VALIDATION_LIMITS.EMAIL.MAX_LENGTH,
		},
	},
	required: ['email'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			email: {
				format: 'Please enter a valid email address',
				maxLength: 'Email must be less than 255 characters',
			},
		},
	},
} as const;

/**
 * Topic validation schema
 */
export const topicSchema = {
	...baseValidationSchema,
	properties: {
		topic: {
			type: 'string',
			minLength: VALIDATION_LIMITS.TOPIC.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.TOPIC.MAX_LENGTH,
			pattern: '^[a-zA-Z0-9\\s\\-_.,!?()]+$',
		},
	},
	required: ['topic'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			topic: {
				minLength: 'Topic must be at least 2 characters long',
				maxLength: 'Topic must be less than 100 characters',
				pattern: 'Topic can only contain letters, numbers, spaces, and basic punctuation',
			},
		},
	},
} as const;

/**
 * Custom difficulty validation schema
 */
export const customDifficultySchema = {
	...baseValidationSchema,
	properties: {
		difficulty: {
			type: 'string',
			minLength: VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.CUSTOM_DIFFICULTY.MAX_LENGTH,
			pattern: `^${CUSTOM_DIFFICULTY_PREFIX}[a-zA-Z0-9\\s\\-_.,!?()]+$`,
		},
	},
	required: ['difficulty'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			difficulty: {
				minLength: 'Custom difficulty must be at least 3 characters long',
				maxLength: 'Custom difficulty must be less than 200 characters',
				pattern: 'Custom difficulty must start with "custom:" and contain valid characters',
			},
		},
	},
} as const;

/**
 * Trivia request validation schema
 */
export const triviaRequestSchema = {
	...baseValidationSchema,
	properties: {
		topic: {
			type: 'string',
			minLength: VALIDATION_LIMITS.TOPIC.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.TOPIC.MAX_LENGTH,
		},
		difficulty: {
			type: 'string',
			enum: ['easy', 'medium', 'hard'],
		},
		questionCount: {
			type: 'number',
			minimum: 1,
			maximum: 50,
		},
	},
	required: ['topic', 'difficulty', 'questionCount'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			topic: {
				minLength: 'Topic must be at least 2 characters long',
				maxLength: 'Topic must be less than 100 characters',
			},
			difficulty: {
				enum: 'Difficulty must be one of: easy, medium, hard',
			},
			questionCount: {
				minimum: 'Question count must be at least 1',
				maximum: 'Question count must be at most 50',
			},
		},
	},
} as const;

/**
 * Points purchase validation schema
 */
export const pointsPurchaseSchema = {
	...baseValidationSchema,
	properties: {
		userId: {
			type: 'string',
			minLength: 1,
		},
		packageId: {
			type: 'string',
			pattern: '^package_\\d+$',
		},
	},
	required: ['userId', 'packageId'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			userId: {
				minLength: 'User ID is required',
			},
			packageId: {
				pattern: 'Invalid package ID format',
			},
		},
	},
} as const;

/**
 * Payment data validation schema
 */
export const paymentDataSchema = {
	...baseValidationSchema,
	properties: {
		planType: {
			type: 'string',
			enum: ['points', 'subscription'],
		},
		email: {
			type: 'string',
			format: 'email',
		},
		first_name: {
			type: 'string',
			minLength: 1,
		},
		last_name: {
			type: 'string',
			minLength: 1,
		},
		cardNumber: {
			type: 'string',
			pattern: '^\\d{13,19}$',
		},
		expiryDate: {
			type: 'string',
			pattern: '^\\d{2}/\\d{2}$',
		},
		cvv: {
			type: 'string',
			pattern: '^\\d{3,4}$',
		},
		cardHolderName: {
			type: 'string',
			minLength: 1,
		},
		agreeToTerms: {
			type: 'boolean',
			enum: [true],
		},
	},
	required: [
		'planType',
		'email',
		'first_name',
		'last_name',
		'cardNumber',
		'expiryDate',
		'cvv',
		'cardHolderName',
		'agreeToTerms',
	],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			planType: {
				enum: 'Plan type must be either "points" or "subscription"',
			},
			email: {
				format: 'Please enter a valid email address',
			},
			first_name: {
				minLength: 'First name is required',
			},
			last_name: {
				minLength: 'Last name is required',
			},
			cardNumber: {
				pattern: 'Please enter a valid card number',
			},
			expiryDate: {
				pattern: 'Please enter expiry date in MM/YY format',
			},
			cvv: {
				pattern: 'Please enter a valid CVV',
			},
			cardHolderName: {
				minLength: 'Card holder name is required',
			},
			agreeToTerms: {
				enum: 'You must agree to the terms and conditions',
			},
		},
	},
} as const;

/**
 * Analytics event validation schema
 */
export const analyticsEventSchema = {
	...baseValidationSchema,
	properties: {
		eventType: {
			type: 'string',
			minLength: 1,
		},
		timestamp: {
			type: 'string',
			format: 'date-time',
		},
		metadata: {
			type: 'object',
			additionalProperties: true,
		},
	},
	required: ['eventType', 'timestamp'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			eventType: {
				minLength: 'Event type is required',
			},
			timestamp: {
				format: 'Invalid timestamp format',
			},
			metadata: {
				type: 'Metadata must be an object',
			},
		},
	},
} as const;

/**
 * User profile validation schema
 */
export const userProfileSchema = {
	...baseValidationSchema,
	properties: {
		username: {
			type: 'string',
			minLength: VALIDATION_LIMITS.USERNAME.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.USERNAME.MAX_LENGTH,
			pattern: '^[a-zA-Z0-9_-]+$',
		},
		email: {
			type: 'string',
			format: 'email',
			maxLength: VALIDATION_LIMITS.EMAIL.MAX_LENGTH,
		},
		password: {
			type: 'string',
			minLength: VALIDATION_LIMITS.PASSWORD.MIN_LENGTH,
			pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$',
		},
	},
	required: ['username', 'email', 'password'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			username: {
				minLength: 'Username must be at least 3 characters long',
				maxLength: 'Username must be less than 30 characters',
				pattern: 'Username can only contain letters, numbers, underscores, and hyphens',
			},
			email: {
				format: 'Please enter a valid email address',
				maxLength: 'Email must be less than 255 characters',
			},
			password: {
				minLength: 'Password must be at least 8 characters long',
				pattern: 'Password must contain uppercase, lowercase, and number',
			},
		},
	},
} as const;

/**
 * Game request validation schema
 */
export const gameRequestSchema = {
	...baseValidationSchema,
	properties: {
		topic: {
			type: 'string',
			minLength: VALIDATION_LIMITS.TOPIC.MIN_LENGTH,
			maxLength: VALIDATION_LIMITS.TOPIC.MAX_LENGTH,
		},
		difficulty: {
			type: 'string',
			enum: ['easy', 'medium', 'hard'],
		},
		questionCount: {
			type: 'number',
			minimum: 1,
			maximum: 50,
		},
		gameMode: {
			type: 'string',
			enum: ['standard', 'timed', 'challenge'],
		},
	},
	required: ['topic', 'difficulty', 'questionCount'],
	errorMessage: {
		...baseValidationSchema.errorMessage,
		properties: {
			topic: {
				minLength: 'Topic must be at least 2 characters long',
				maxLength: 'Topic must be less than 100 characters',
			},
			difficulty: {
				enum: 'Difficulty must be one of: easy, medium, hard',
			},
			questionCount: {
				minimum: 'Question count must be at least 1',
				maximum: 'Question count must be at most 50',
			},
			gameMode: {
				enum: 'Game mode must be one of: standard, timed, challenge',
			},
		},
	},
} as const;

/**
 * Schema registry for easy access
 */
export const validationSchemas = {
	username: usernameSchema,
	password: passwordSchema,
	email: emailSchema,
	topic: topicSchema,
	customDifficulty: customDifficultySchema,
	triviaRequest: triviaRequestSchema,
	pointsPurchase: pointsPurchaseSchema,
	paymentData: paymentDataSchema,
	analyticsEvent: analyticsEventSchema,
	userProfile: userProfileSchema,
	gameRequest: gameRequestSchema,
} as const;

/**
 * Get validation schema by name
 * @param name Schema name
 * @returns Validation schema or null if not found
 */
export function getValidationSchema(name: SchemaName) {
	return validationSchemas[name] || null;
}

/**
 * Get all available schema names
 * @returns Array of schema names
 */
export function getAvailableSchemaNames(): SchemaName[] {
	return Object.keys(validationSchemas) as SchemaName[];
}

/**
 * Validate schema name
 * @param name Schema name to validate
 * @returns True if valid schema name
 */
export function isValidSchemaName(name: string): name is SchemaName {
	return name in validationSchemas;
}
