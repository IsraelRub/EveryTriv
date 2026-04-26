import {
	ERROR_CODE_ENUM_LIKE_PATTERN,
	ERROR_CODE_TO_USER_MESSAGE,
	ERROR_CODE_VALUES,
	ERROR_DEBUG_NO_STACK_TRACE,
	ERROR_MESSAGE_PATTERN_MAP,
	ERROR_MESSAGES,
	ERROR_TYPE_TO_MESSAGE,
	GENERIC_BAD_REQUEST_WRAPPER_MESSAGES,
	HTTP_NETWORK_ERROR_CODES_SET,
	HTTP_STATUS_CODES,
	HTTP_TIMEOUT_ERROR_CODES_SET,
	NEST_EXCEPTION_NAMES,
	NESTED_ERROR_MESSAGE_MAX_DEPTH,
	NESTED_ERROR_MESSAGE_PRIORITY_KEYS,
	type ErrorCode,
} from '../../constants';
import type { ErrorResponseData, ProviderAuthError, ProviderRateLimitError } from '../../types';
import { VALIDATORS } from '../../validation';
import { hasProperty, isNonEmptyString, isRecord } from './data.utils';

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
	if (depth > NESTED_ERROR_MESSAGE_MAX_DEPTH || value == null) {
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
		for (const key of NESTED_ERROR_MESSAGE_PRIORITY_KEYS) {
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
	return message === message.toUpperCase() && ERROR_CODE_ENUM_LIKE_PATTERN.test(message);
};

function mapFlatApiErrorString(value: string): string {
	return isErrorCode(value) ? getMessageForErrorCode(value) : value;
}

export function getErrorCode(error: unknown): string | undefined {
	if (error instanceof Error && error.message && isErrorCodeValue(error.message)) {
		return error.message;
	}
	if (isRecord(error) && 'message' in error && isNonEmptyString(error.message) && isErrorCodeValue(error.message)) {
		return error.message;
	}
	return undefined;
}

function collectStringErrorsFromDetail(detail: unknown): string[] {
	if (!Array.isArray(detail)) {
		return [];
	}
	return detail
		.filter((item): item is string => VALIDATORS.string(item) && item.trim().length > 0)
		.map(item => item.trim());
}

export function pickPrimaryClientErrorString(data: ErrorResponseData): string | undefined {
	if (VALIDATORS.string(data.code)) {
		const trimmedCode = data.code.trim();
		if (trimmedCode.length > 0) {
			return trimmedCode;
		}
	}

	const trimmedMessage = VALIDATORS.string(data.message) ? data.message.trim() : '';
	const stringErrors = collectStringErrorsFromDetail(data.errors);

	if (stringErrors.length > 0) {
		if (trimmedMessage.length === 0 || GENERIC_BAD_REQUEST_WRAPPER_MESSAGES.has(trimmedMessage)) {
			return stringErrors.join('; ');
		}
	}

	if (trimmedMessage.length > 0) {
		return data.message as string;
	}
	if (VALIDATORS.string(data.error) && data.error.trim().length > 0) {
		return data.error.trim();
	}
	if (VALIDATORS.string(data.detail) && data.detail.trim().length > 0) {
		return data.detail.trim();
	}
	if (VALIDATORS.string(data.description) && data.description.trim().length > 0) {
		return data.description.trim();
	}
	return undefined;
}

function recordToErrorResponseData(record: Record<string, unknown>): ErrorResponseData {
	return {
		message: VALIDATORS.string(record.message) ? record.message : undefined,
		code: VALIDATORS.string(record.code) ? record.code : undefined,
		error: VALIDATORS.string(record.error) ? record.error : undefined,
		detail: VALIDATORS.string(record.detail) ? record.detail : undefined,
		description: VALIDATORS.string(record.description) ? record.description : undefined,
		errors:
			record.errors !== undefined && record.errors !== null
				? (record.errors as ErrorResponseData['errors'])
				: undefined,
	};
}

function resolveMessageFromApiErrorRecord(record: Record<string, unknown>): string | null {
	const picked = pickPrimaryClientErrorString(recordToErrorResponseData(record));
	if (picked == null || picked.trim() === '') {
		return null;
	}
	return mapFlatApiErrorString(picked);
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

	if (responseData) {
		const fromBody = resolveMessageFromApiErrorRecord(responseData);
		if (fromBody !== null) {
			return fromBody;
		}
		const nestedMessage = extractNestedErrorMessage(responseData);
		if (nestedMessage) {
			return mapFlatApiErrorString(nestedMessage);
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
	for (const { pattern, message: mappedMessage } of ERROR_MESSAGE_PATTERN_MAP) {
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
	const fromApi = resolveMessageFromApiErrorRecord(error);
	if (fromApi !== null) {
		return fromApi;
	}

	const nestedMessage = extractNestedErrorMessage(error);
	if (nestedMessage) {
		return mapFlatApiErrorString(nestedMessage);
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
		return mapFlatApiErrorString(error);
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
		return error.stack ?? ERROR_DEBUG_NO_STACK_TRACE;
	}
	return ERROR_DEBUG_NO_STACK_TRACE;
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
	if (!(error instanceof Error) || !isRecord(error)) {
		return false;
	}

	const errorCode = 'code' in error && VALIDATORS.string(error.code) ? error.code : undefined;
	return errorCode !== undefined && HTTP_NETWORK_ERROR_CODES_SET.has(errorCode);
}

export function isTimeoutError(error: unknown): boolean {
	if (!(error instanceof Error) || !isRecord(error)) {
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

export function isCancelledOrAbortError(error: unknown): boolean {
	if (isErrorWithProperties(error) && error.name === 'AbortError') {
		return true;
	}
	return getErrorMessage(error) === 'Request was cancelled';
}
