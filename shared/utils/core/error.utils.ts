import {
	ERROR_MESSAGES,
	HTTP_ERROR_MESSAGES,
	HTTP_NETWORK_ERROR_CODES_SET,
	HTTP_TIMEOUT_ERROR_CODES_SET,
	MAX_NESTED_ERROR_DEPTH,
	NEST_EXCEPTION_NAME_SET,
	VALIDATORS,
} from '../../constants';
import type { ProviderAuthError, ProviderErrorWithStatusCode, ProviderRateLimitError } from '../../types';
import { hasProperty, isRecord } from './data.utils';

export function isErrorWithResponseStatus(error: unknown): error is { response?: { status?: number } } {
	if (!isRecord(error)) {
		return false;
	}

	if (!('response' in error)) {
		return false;
	}

	const response = error.response;
	if (response === undefined) {
		return true;
	}

	if (!isRecord(response)) {
		return false;
	}

	return !('status' in response) || VALIDATORS.number(response.status) || response.status === undefined;
}

export function isErrorWithCode(error: unknown): error is { code?: string } {
	if (!isRecord(error)) {
		return false;
	}

	return !('code' in error) || VALIDATORS.string(error.code) || error.code === undefined;
}

const extractNestedErrorMessage = (value: unknown, depth: number = 0): string | null => {
	if (depth > MAX_NESTED_ERROR_DEPTH || value == null) {
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
		const prioritizedKeys: readonly string[] = ['message', 'error', 'detail', 'description', 'errors'];

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

// Structured error code mapping for Error instances
const ERROR_CODE_MAP: Record<string, string> = {
	JsonWebTokenError: ERROR_MESSAGES.general.AUTHENTICATION_FAILED,
	TokenExpiredError: ERROR_MESSAGES.general.AUTHENTICATION_FAILED,
	NotBeforeError: ERROR_MESSAGES.general.AUTHENTICATION_FAILED,
	QueryFailedError: ERROR_MESSAGES.general.DATABASE_OPERATION_FAILED,
	ConnectionTimeoutError: ERROR_MESSAGES.general.DATABASE_OPERATION_FAILED,
	RedisError: ERROR_MESSAGES.general.CACHE_OPERATION_FAILED,
};

// Structured error pattern mapping for message content
const ERROR_PATTERN_MAP: { pattern: RegExp; message: string }[] = [
	{ pattern: /validation/i, message: ERROR_MESSAGES.general.INVALID_INPUT_DATA },
	{ pattern: /redis|cache/i, message: ERROR_MESSAGES.general.CACHE_OPERATION_FAILED },
	{ pattern: /timeout/i, message: HTTP_ERROR_MESSAGES.TIMEOUT_ERROR },
	{ pattern: /rate limit|too many requests/i, message: ERROR_MESSAGES.general.RATE_LIMIT_EXCEEDED },
	{ pattern: /memory|out of memory/i, message: ERROR_MESSAGES.general.INSUFFICIENT_RESOURCES },
	{ pattern: /enoent|file not found/i, message: ERROR_MESSAGES.general.FILE_NOT_FOUND },
	{ pattern: /eacces|permission denied/i, message: ERROR_MESSAGES.general.PERMISSION_DENIED },
];

const isErrorCode = (message: string): boolean => {
	return message === message.toUpperCase() && /^[A-Z_]+$/.test(message);
};

const getHttpErrorMessage = (error: Error & { code?: string; response?: unknown }): string | null => {
	const errorCode = VALIDATORS.string(error.code) ? error.code : undefined;

	// Check timeout/network error codes first
	if (errorCode && HTTP_TIMEOUT_ERROR_CODES_SET.has(errorCode)) {
		return HTTP_ERROR_MESSAGES.TIMEOUT_ERROR;
	}
	if (errorCode && HTTP_NETWORK_ERROR_CODES_SET.has(errorCode)) {
		return HTTP_ERROR_MESSAGES.NETWORK_ERROR;
	}

	// Extract response data
	const response = isRecord(error.response) ? error.response : undefined;
	const responseData = response && 'data' in response && isRecord(response.data) ? response.data : undefined;

	// Try response data fields in priority order
	if (responseData) {
		if ('message' in responseData && VALIDATORS.string(responseData.message)) {
			return responseData.message;
		}
		if ('error' in responseData && VALIDATORS.string(responseData.error)) {
			return responseData.error;
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

	// Try response status
	if (response && 'status' in response && VALIDATORS.number(response.status)) {
		return HTTP_ERROR_MESSAGES.SERVER_ERROR;
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
		return error.message ?? HTTP_ERROR_MESSAGES.NETWORK_ERROR;
	}

	// Check error code mapping (Error types)
	if (ERROR_CODE_MAP[errorName]) {
		return ERROR_CODE_MAP[errorName];
	}

	// Check if message is an error code (uppercase with underscores)
	if (isErrorCode(message)) {
		return message;
	}

	// Check error pattern mapping (message content)
	for (const { pattern, message: mappedMessage } of ERROR_PATTERN_MAP) {
		if (pattern.test(normalizedMessage)) {
			return mappedMessage;
		}
	}

	// Handle NestJS exceptions
	if (NEST_EXCEPTION_NAME_SET.has(errorName)) {
		return error.message ?? ERROR_MESSAGES.general.REQUEST_FAILED;
	}

	// Try nested error message
	const nestedDetail = extractNestedErrorMessage(error);
	if (nestedDetail && nestedDetail !== message) {
		return nestedDetail;
	}

	// Default Error
	return error.message ?? HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
};

const getRecordErrorMessage = (error: Record<string, unknown>): string | null => {
	// Check if message property exists and is a string
	if ('message' in error && VALIDATORS.string(error.message)) {
		const message = error.message;
		// Check if message is an error code (uppercase with underscores)
		if (isErrorCode(message)) {
			return message;
		}
		// Check if message contains "validation" (but not error codes)
		if (message.toLowerCase().includes('validation')) {
			return ERROR_MESSAGES.general.INVALID_INPUT_DATA;
		}
		// Return the message as-is
		return message;
	}

	// Try nested message
	const nestedMessage = extractNestedErrorMessage(error);
	if (nestedMessage) {
		// Check if nested message is an error code
		if (isErrorCode(nestedMessage)) {
			return nestedMessage;
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

	// Handle string errors
	if (VALIDATORS.string(error)) {
		return error;
	}

	// Handle null/undefined
	if (error == null) {
		return 'No error information available.';
	}

	// Handle objects with error-like properties
	if (isRecord(error)) {
		const recordMessage = getRecordErrorMessage(error);
		if (recordMessage) {
			return recordMessage;
		}
	}

	// Fallback for any other type
	return 'Unknown error occurred.';
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

export function isProviderErrorWithStatusCode(error: unknown): error is ProviderErrorWithStatusCode {
	if (!(error instanceof Error)) {
		return false;
	}

	return 'statusCode' in error && VALIDATORS.number(error.statusCode);
}
