import {
	ERROR_MESSAGES,
	ErrorCode,
	HTTP_NETWORK_ERROR_CODES_SET,
	HTTP_STATUS_CODES,
	HTTP_TIMEOUT_ERROR_CODES_SET,
	NEST_EXCEPTION_NAMES,
} from '../../constants';
import type { ProviderAuthError, ProviderRateLimitError } from '../../types';
import { VALIDATORS } from '../../validation';
import { hasProperty, isRecord } from './data.utils';

export function isErrorWithProperties(error: unknown): error is { name?: string; message?: string } {
	if (!isRecord(error)) {
		return false;
	}

	return (
		(error.name === undefined || VALIDATORS.string(error.name)) &&
		(error.message === undefined || VALIDATORS.string(error.message))
	);
}

const extractNestedErrorMessage = (value: unknown, depth: number = 0): string | null => {
	if (depth > 5 || value == null) {
		return null;
	}

	if (VALIDATORS.string(value)) {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const nestedResult = extractNestedErrorMessage(item, depth + 1);
			if (nestedResult) {
				return nestedResult;
			}
		}
		return null;
	}

	if (isRecord(value)) {
		const prioritizedKeys: readonly string[] = [
			'message',
			'error_description',
			'error',
			'detail',
			'description',
			'errors',
		];

		for (const key of prioritizedKeys) {
			if (key in value) {
				const prioritizedValue = extractNestedErrorMessage(value[key], depth + 1);
				if (prioritizedValue) {
					return prioritizedValue;
				}
			}
		}

		for (const entryValue of Object.values(value)) {
			const nestedResult = extractNestedErrorMessage(entryValue, depth + 1);
			if (nestedResult) {
				return nestedResult;
			}
		}
	}

	return null;
};

const ERROR_TYPE_TO_MESSAGE: Record<string, string> = {
	JsonWebTokenError: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	TokenExpiredError: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	NotBeforeError: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	QueryFailedError: ERROR_MESSAGES.database.DATABASE_OPERATION_FAILED,
	ConnectionTimeoutError: ERROR_MESSAGES.database.DATABASE_OPERATION_FAILED,
	RedisError: ERROR_MESSAGES.cache.CACHE_OPERATION_FAILED,
};

// Structured error pattern mapping for message content
const ERROR_PATTERN_MAP: { pattern: RegExp; message: string }[] = [
	{ pattern: /validation/i, message: ERROR_MESSAGES.validation.INVALID_INPUT_DATA },
	{ pattern: /redis|cache/i, message: ERROR_MESSAGES.cache.CACHE_OPERATION_FAILED },
	{
		pattern: /database|query failed|connection.*refused|sql/i,
		message: ERROR_MESSAGES.database.DATABASE_OPERATION_FAILED,
	},
	{ pattern: /timeout/i, message: ERROR_MESSAGES.timeout.REQUEST_TIMEOUT },
	{ pattern: /rate limit|too many requests/i, message: ERROR_MESSAGES.api.RATE_LIMIT_EXCEEDED },
	{ pattern: /memory|out of memory/i, message: ERROR_MESSAGES.general.INSUFFICIENT_RESOURCES },
	{ pattern: /enoent|file not found/i, message: ERROR_MESSAGES.storage.FILE_NOT_FOUND },
	{
		pattern: /serializ|deserializ|failed to get item|failed to set item|failed to clear storage/i,
		message: ERROR_MESSAGES.storage.STORAGE_OPERATION_FAILED,
	},
	{
		pattern: /ai provider|generation failed|invalid response format|unable to generate/i,
		message: ERROR_MESSAGES.provider.INVALID_PROVIDER_RESPONSE,
	},
	{ pattern: /eacces|permission denied/i, message: ERROR_MESSAGES.auth.PERMISSION_DENIED },
];

const ERROR_CODE_TO_USER_MESSAGE: Partial<Record<ErrorCode, string>> = {
	[ErrorCode.UNAUTHORIZED]: ERROR_MESSAGES.auth.UNAUTHORIZED,
	[ErrorCode.FORBIDDEN]: ERROR_MESSAGES.auth.FORBIDDEN,
	[ErrorCode.USER_NOT_AUTHENTICATED]: ERROR_MESSAGES.auth.UNAUTHORIZED,
	[ErrorCode.AUTHENTICATION_TOKEN_REQUIRED]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.INVALID_CREDENTIALS]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.INVALID_REFRESH_TOKEN]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.TOKEN_REFRESH_FAILED]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.AUTHENTICATION_FAILED_GENERIC]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.USER_NOT_FOUND_OR_AUTH_FAILED]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.NOT_FOUND]: ERROR_MESSAGES.api.NOT_FOUND,
	[ErrorCode.VALIDATION_ERROR]: ERROR_MESSAGES.validation.INPUT_VALIDATION_FAILED,
	[ErrorCode.INTERNAL_SERVER_ERROR]: ERROR_MESSAGES.api.INTERNAL_SERVER_ERROR,
	[ErrorCode.NETWORK_ERROR]: ERROR_MESSAGES.api.NETWORK_ERROR,
	[ErrorCode.USER_DATA_VALIDATION_FAILED]: ERROR_MESSAGES.validation.INPUT_VALIDATION_FAILED,
	[ErrorCode.AVATAR_ID_OUT_OF_RANGE]: ERROR_MESSAGES.user.AVATAR_ID_OUT_OF_RANGE,
	[ErrorCode.SEARCH_QUERY_TOO_SHORT]: ERROR_MESSAGES.user.SEARCH_QUERY_REQUIRED,
	[ErrorCode.REQUIRED_USER_ID]: ERROR_MESSAGES.user.USER_ID_REQUIRED,
	[ErrorCode.ROOM_NOT_FOUND]: ERROR_MESSAGES.api.NOT_FOUND,
	[ErrorCode.HOST_USER_NOT_FOUND]: ERROR_MESSAGES.auth.AUTHENTICATION_FAILED,
	[ErrorCode.ARRAY_EMPTY_OR_ITEM_NOT_FOUND]: ERROR_MESSAGES.client.ARRAY_EMPTY_OR_ITEM_NOT_FOUND,
	[ErrorCode.GAME_DATA_USER_ID_REQUIRED]: ERROR_MESSAGES.validation.GAME_DATA_USER_ID_REQUIRED,
	[ErrorCode.GAME_ID_REQUIRED]: ERROR_MESSAGES.validation.GAME_ID_REQUIRED,
	[ErrorCode.EVENT_TYPE_REQUIRED]: ERROR_MESSAGES.validation.EVENT_TYPE_REQUIRED,
	[ErrorCode.QUESTION_GENERATION_TIMEOUT]: ERROR_MESSAGES.timeout.REQUEST_TIMEOUT,
	[ErrorCode.AI_RETURNED_EMPTY_RESPONSE]: ERROR_MESSAGES.provider.INVALID_PROVIDER_RESPONSE,
	[ErrorCode.RESPONSE_CONTENT_EMPTY]: ERROR_MESSAGES.provider.INVALID_PROVIDER_RESPONSE,
	[ErrorCode.NO_GROQ_MODEL_AVAILABLE]: ERROR_MESSAGES.provider.NO_GROQ_MODEL_AVAILABLE,
	[ErrorCode.CACHE_SYNC_ERROR]: ERROR_MESSAGES.cache.CACHE_OPERATION_FAILED,
	[ErrorCode.REDIS_ERROR]: ERROR_MESSAGES.cache.CACHE_OPERATION_FAILED,
	[ErrorCode.DATABASE_PASSWORD_REQUIRED]: ERROR_MESSAGES.config.DATABASE_PASSWORD_REQUIRED,
	[ErrorCode.PAYMENT_NOT_COMPLETED]: ERROR_MESSAGES.payment.PAYMENT_NOT_COMPLETED,
	[ErrorCode.FAILED_TO_INITIALIZE_PAYPAL]: ERROR_MESSAGES.payment.FAILED_TO_INITIALIZE_PAYPAL,
	[ErrorCode.INSUFFICIENT_CREDITS]: ERROR_MESSAGES.game.INSUFFICIENT_CREDITS,
};

const ERROR_CODE_VALUES = new Set<string>(Object.values(ErrorCode));

function isErrorCodeValue(code: string): code is ErrorCode {
	return ERROR_CODE_VALUES.has(code);
}

function getMessageForErrorCode(code: string): string {
	if (isErrorCodeValue(code)) {
		return ERROR_CODE_TO_USER_MESSAGE[code] ?? code;
	}
	return code;
}

const isErrorCode = (message: string): boolean => {
	return message === message.toUpperCase() && /^[A-Z_]+$/.test(message);
};

/**
 * Extracts a known error code from an error (e.g. Nest exception message or Error.message).
 * Returns undefined if no recognized ErrorCode is found.
 */
export function getErrorCode(error: unknown): string | undefined {
	if (error instanceof Error && error.message && isErrorCodeValue(error.message)) {
		return error.message;
	}
	if (isRecord(error) && 'message' in error && VALIDATORS.string(error.message) && isErrorCodeValue(error.message)) {
		return error.message;
	}
	return undefined;
}

const getHttpErrorMessage = (error: Error & { code?: string; response?: unknown }): string | null => {
	const errorCode = VALIDATORS.string(error.code) ? error.code : undefined;

	// Check timeout/network error codes first
	if (errorCode && HTTP_TIMEOUT_ERROR_CODES_SET.has(errorCode)) {
		return ERROR_MESSAGES.timeout.REQUEST_TIMEOUT;
	}
	if (errorCode && HTTP_NETWORK_ERROR_CODES_SET.has(errorCode)) {
		return ERROR_MESSAGES.api.NETWORK_ERROR;
	}

	// Extract response data
	const response = isRecord(error.response) ? error.response : undefined;
	const responseData = response && 'data' in response && isRecord(response.data) ? response.data : undefined;

	// Try response data fields in priority order
	if (responseData) {
		if ('message' in responseData && VALIDATORS.string(responseData.message)) {
			const msg = responseData.message;
			return isErrorCode(msg) ? getMessageForErrorCode(msg) : msg;
		}
		if ('error' in responseData && VALIDATORS.string(responseData.error)) {
			const errMsg = responseData.error;
			return isErrorCode(errMsg) ? getMessageForErrorCode(errMsg) : errMsg;
		}
		const nestedMessage = extractNestedErrorMessage(responseData);
		if (nestedMessage) {
			return nestedMessage;
		}
	}

	// Try response statusText
	if (response && 'statusText' in response && VALIDATORS.string(response.statusText)) {
		return response.statusText;
	}

	// Try response status with specific messages based on status code
	if (response && 'status' in response && VALIDATORS.number(response.status)) {
		const status = response.status;
		switch (status) {
			case HTTP_STATUS_CODES.NOT_FOUND:
				return ERROR_MESSAGES.api.NOT_FOUND;
			case HTTP_STATUS_CODES.UNAUTHORIZED:
				return ERROR_MESSAGES.auth.UNAUTHORIZED;
			case HTTP_STATUS_CODES.FORBIDDEN:
				return ERROR_MESSAGES.auth.FORBIDDEN;
			case HTTP_STATUS_CODES.TOO_MANY_REQUESTS:
				return ERROR_MESSAGES.api.RATE_LIMIT_EXCEEDED;
			default:
				if (status >= HTTP_STATUS_CODES.SERVER_ERROR_MIN && status <= HTTP_STATUS_CODES.SERVER_ERROR_MAX) {
					return ERROR_MESSAGES.api.INTERNAL_SERVER_ERROR;
				}
				if (status >= HTTP_STATUS_CODES.BAD_REQUEST && status < HTTP_STATUS_CODES.SERVER_ERROR_MIN) {
					return ERROR_MESSAGES.validation.INPUT_VALIDATION_FAILED;
				}
				return ERROR_MESSAGES.api.INTERNAL_SERVER_ERROR;
		}
	}

	return null;
};

const getErrorInstanceMessage = (error: Error): string => {
	const errorName = error.constructor.name;
	const message = error.message ?? '';
	const normalizedMessage = message.toLowerCase();

	// Check if it's an HTTP error
	const hasHttpErrorProperties =
		isRecord(error) &&
		(isRecord(error.response) || isRecord(error.config) || VALIDATORS.string(error.code)) &&
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		(error.code || error.response);

	if (hasHttpErrorProperties && error instanceof Error) {
		const httpError: Error & { code?: string; response?: unknown } = error;
		if ('code' in error && VALIDATORS.string(error.code)) {
			httpError.code = error.code;
		}
		if ('response' in error) {
			httpError.response = error.response;
		}
		const httpMessage = getHttpErrorMessage(httpError);
		if (httpMessage) {
			return httpMessage;
		}
		return error.message ?? ERROR_MESSAGES.api.NETWORK_ERROR;
	}

	// Check error type mapping (constructor name)
	if (ERROR_TYPE_TO_MESSAGE[errorName]) {
		return ERROR_TYPE_TO_MESSAGE[errorName];
	}

	// Check if message is an error code (uppercase with underscores) – map to user-facing message
	if (isErrorCode(message)) {
		return getMessageForErrorCode(message);
	}

	// Check error pattern mapping (message content)
	for (const { pattern, message: mappedMessage } of ERROR_PATTERN_MAP) {
		if (pattern.test(normalizedMessage)) {
			return mappedMessage;
		}
	}

	// Handle NestJS exceptions
	if (NEST_EXCEPTION_NAMES.has(errorName)) {
		return error.message ?? ERROR_MESSAGES.general.REQUEST_FAILED;
	}

	// Try nested error message
	const nestedDetail = extractNestedErrorMessage(error);
	if (nestedDetail && nestedDetail !== message) {
		return nestedDetail;
	}

	// Default Error
	return error.message ?? ERROR_MESSAGES.general.UNKNOWN_ERROR;
};

const getRecordErrorMessage = (error: Record<string, unknown>): string | null => {
	// Check if message property exists and is a string
	if ('message' in error && VALIDATORS.string(error.message)) {
		const message = error.message;
		// Check if message is an error code (uppercase with underscores) – map to user-facing message
		if (isErrorCode(message)) {
			return getMessageForErrorCode(message);
		}
		// Check if message contains "validation" (but not error codes)
		if (message.toLowerCase().includes('validation')) {
			return ERROR_MESSAGES.validation.INVALID_INPUT_DATA;
		}
		// Return the message as-is
		return message;
	}

	// Try nested message
	const nestedMessage = extractNestedErrorMessage(error);
	if (nestedMessage) {
		if (isErrorCode(nestedMessage)) {
			return getMessageForErrorCode(nestedMessage);
		}
		return nestedMessage;
	}

	return null;
};

export function getErrorMessage(error: unknown): string {
	// Handle Error instances
	if (error instanceof Error) {
		return getErrorInstanceMessage(error);
	}

	// Handle string errors (e.g. from API) – map if it's an error code
	if (VALIDATORS.string(error)) {
		return isErrorCode(error) ? getMessageForErrorCode(error) : error;
	}

	// Handle null/undefined
	if (error == null) {
		return ERROR_MESSAGES.general.UNKNOWN_ERROR;
	}

	// Handle objects with error-like properties
	if (isRecord(error)) {
		const recordMessage = getRecordErrorMessage(error);
		if (recordMessage) {
			return recordMessage;
		}
	}

	return ERROR_MESSAGES.general.UNKNOWN_ERROR;
}

export function getErrorStack(error: unknown): string {
	if (error instanceof Error) {
		return error.stack ?? 'No stack trace available';
	}
	return 'No stack trace available';
}

export function getErrorType(error: unknown): string {
	return error instanceof Error ? error.constructor.name : typeof error;
}

export function ensureErrorObject(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	// Create new Error with message
	const errorMessage = getErrorMessage(error);
	const newError = new Error(errorMessage);

	// Preserve all properties from the original error if it's a record
	if (isRecord(error)) {
		Object.assign(newError, error);
	}

	return newError;
}

export function extractValidationErrors(error: unknown): string[] {
	const errors: string[] = [];

	if (!isRecord(error)) {
		return errors;
	}

	let rawDetails: unknown;
	if (hasProperty(error, 'details') && isRecord(error.details)) {
		rawDetails = error.details;
	} else if (hasProperty(error, 'response') && isRecord(error.response)) {
		const response = error.response;
		if (hasProperty(response, 'data') && isRecord(response.data)) {
			rawDetails = response.data;
		}
	} else {
		rawDetails = error;
	}

	let rawErrors: unknown;
	if (isRecord(rawDetails)) {
		if (hasProperty(rawDetails, 'errors')) {
			rawErrors = rawDetails.errors;
		}
		if (!rawErrors && hasProperty(rawDetails, 'error')) {
			const errorValue = rawDetails.error;
			if (Array.isArray(errorValue)) {
				rawErrors = errorValue;
			}
		}
	}

	if (Array.isArray(rawErrors)) {
		for (const item of rawErrors) {
			if (VALIDATORS.string(item)) {
				errors.push(item);
			} else if (hasProperty(item, 'message') && VALIDATORS.string(item.message)) {
				errors.push(item.message);
			} else if (hasProperty(item, 'constraints') && isRecord(item.constraints)) {
				const constraints = item.constraints;
				for (const constraintValue of Object.values(constraints)) {
					if (VALIDATORS.string(constraintValue)) {
						errors.push(constraintValue);
					}
				}
			}
		}
	} else if (VALIDATORS.string(rawErrors)) {
		try {
			const parsed = JSON.parse(rawErrors);
			if (Array.isArray(parsed)) {
				for (const item of parsed) {
					if (VALIDATORS.string(item)) {
						errors.push(item);
					} else if (hasProperty(item, 'message') && VALIDATORS.string(item.message)) {
						errors.push(item.message);
					}
				}
			}
		} catch {
			errors.push(rawErrors);
		}
	}

	return errors;
}

export function isProviderAuthError(error: unknown): error is ProviderAuthError {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'isAuthError' in error && error.isAuthError === true;
}

export function isProviderRateLimitError(error: unknown): error is ProviderRateLimitError {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'isRateLimitError' in error && error.isRateLimitError === true;
}

export function getErrorStatusCode(error: unknown): number | null {
	if (!isRecord(error)) {
		return null;
	}

	// Check direct statusCode property
	if ('statusCode' in error && VALIDATORS.number(error.statusCode)) {
		return error.statusCode;
	}

	// Check response.status
	if ('response' in error && isRecord(error.response)) {
		const response = error.response;
		if ('status' in response && VALIDATORS.number(response.status)) {
			return response.status;
		}
	}

	return null;
}

export function isNetworkError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	if (!isRecord(error)) {
		return false;
	}

	const errorCode = 'code' in error && VALIDATORS.string(error.code) ? error.code : undefined;
	return errorCode !== undefined && HTTP_NETWORK_ERROR_CODES_SET.has(errorCode);
}

export function isTimeoutError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	if (!isRecord(error)) {
		return false;
	}

	const errorCode = 'code' in error && VALIDATORS.string(error.code) ? error.code : undefined;
	return errorCode !== undefined && HTTP_TIMEOUT_ERROR_CODES_SET.has(errorCode);
}

export function isServerError(error: unknown): boolean {
	const statusCode = getErrorStatusCode(error);
	if (statusCode === null) {
		return false;
	}

	return statusCode >= HTTP_STATUS_CODES.SERVER_ERROR_MIN && statusCode <= HTTP_STATUS_CODES.SERVER_ERROR_MAX;
}

export function isClientError(error: unknown): boolean {
	const statusCode = getErrorStatusCode(error);
	if (statusCode === null) {
		return false;
	}

	return statusCode >= HTTP_STATUS_CODES.BAD_REQUEST && statusCode < HTTP_STATUS_CODES.SERVER_ERROR_MIN;
}
