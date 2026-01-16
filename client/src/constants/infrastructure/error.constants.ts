// Expected errors that are not caused by bugs in the code
export const EXPECTED_ERROR_CODES = new Set<string>([
	// Authentication - expected user errors
	'INVALID_CREDENTIALS',
	'EMAIL_ALREADY_REGISTERED',
	'USER_NOT_FOUND_OR_AUTH_FAILED',
	'CURRENT_PASSWORD_INCORRECT',
	'PASSWORD_NOT_SET',

	// Validation - user input errors
	'VALIDATION_ERROR',
	'INVALID_INPUT_DATA',

	// Credits - business logic
	'INSUFFICIENT_CREDITS',

	// Access control - expected denials
	'UNAUTHORIZED',
	'FORBIDDEN',
	'ACCOUNT_IS_INACTIVE',
]);
