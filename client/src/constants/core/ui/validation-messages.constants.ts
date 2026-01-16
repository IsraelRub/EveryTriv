export const VALIDATION_MESSAGES = {
	// General field messages
	FIELD_REQUIRED: (fieldName: string) => `${fieldName} is required`,
	FIELD_INVALID: (fieldName: string) => `Invalid ${fieldName.toLowerCase()}`,

	// First name validation
	FIRST_NAME_REQUIRED: 'First name is required',
	FIRST_NAME_MIN_LENGTH: (minLength: number) =>
		`First name must be at least ${minLength} character${minLength > 1 ? 's' : ''}`,
	FIRST_NAME_MAX_LENGTH: (maxLength: number) => `First name must not exceed ${maxLength} characters`,

	// Last name validation
	LAST_NAME_MAX_LENGTH: (maxLength: number) => `Last name must not exceed ${maxLength} characters`,

	// Email validation
	EMAIL_REQUIRED: 'Email is required',
	EMAIL_INVALID: 'Please enter a valid email address',

	// Password validation
	PASSWORD_REQUIRED: 'Password is required',
	CURRENT_PASSWORD_REQUIRED: 'Current password is required',
	PASSWORD_INVALID: 'Invalid password',
	PASSWORD_CONFIRMATION_INVALID: 'Invalid password confirmation',

	// Room code validation
	ROOM_CODE_REQUIRED: 'Please enter a room code',

	// User ID validation
	USER_ID_REQUIRED: 'Please enter a user ID',

	// Custom difficulty validation
	CUSTOM_DIFFICULTY_INVALID: 'Invalid custom difficulty',

	// Password confirmation validation
	PASSWORD_CONFIRMATION_REQUIRED: 'Please confirm your password',
	PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',

	// Game validation
	QUESTION_ID_REQUIRED: 'Question ID is required',
	ANSWER_REQUIRED: 'Answer is required',
	TIME_SPENT_NON_NEGATIVE: 'Time spent must be non-negative',

	// Service validation
	VALUE_REQUIRED: 'Value is required',
	REASON_REQUIRED: 'Reason is required',
	LIMIT_RANGE: (min: number, max: number) => `Limit must be between ${min} and ${max}`,
	OFFSET_NON_NEGATIVE: 'Offset must be non-negative',
	STATUS_INVALID: 'Status must be active, suspended, or banned',
} as const;
