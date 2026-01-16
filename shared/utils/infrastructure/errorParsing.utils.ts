import { VALIDATORS } from '@shared/constants';
import type { ErrorDetail, ErrorResponse, ErrorResponseData, ValidationErrorResponse } from '@shared/types';

import { hasProperty, isRecord, isStringArray } from '../core/data.utils';

function isErrorDetail(value: unknown): value is ErrorDetail {
	if (VALIDATORS.string(value)) {
		return true;
	}
	if (isRecord(value)) {
		// Check if all values are strings or string arrays
		return Object.values(value).every(val => VALIDATORS.string(val) || isStringArray(val));
	}
	return isStringArray(value);
}

function isValidValidationErrors(value: unknown): value is string[] | Record<string, string | string[]> {
	// Use isErrorDetail but exclude single strings (only arrays and records are valid)
	return isErrorDetail(value) && !VALIDATORS.string(value);
}

export function parseErrorResponseData(jsonData: unknown): ErrorResponseData {
	if (!isRecord(jsonData)) {
		return {};
	}

	const errorData: ErrorResponseData = {};

	// Extract message
	if (hasProperty(jsonData, 'message')) {
		if (VALIDATORS.string(jsonData.message)) {
			errorData.message = jsonData.message;
		} else if (isStringArray(jsonData.message)) {
			// Some frameworks may return message as an array of strings
			errorData.message = jsonData.message.join(', ');
		}
	}

	// Extract error
	if (hasProperty(jsonData, 'error') && VALIDATORS.string(jsonData.error)) {
		errorData.error = jsonData.error;
	}

	// Extract detail
	if (hasProperty(jsonData, 'detail') && VALIDATORS.string(jsonData.detail)) {
		errorData.detail = jsonData.detail;
	}

	// Extract description
	if (hasProperty(jsonData, 'description') && VALIDATORS.string(jsonData.description)) {
		errorData.description = jsonData.description;
	}

	// Extract code (error code from server)
	if (hasProperty(jsonData, 'code') && VALIDATORS.string(jsonData.code)) {
		errorData.code = jsonData.code;
	}

	// Extract errors (validation errors)
	if (hasProperty(jsonData, 'errors') && isErrorDetail(jsonData.errors)) {
		errorData.errors = jsonData.errors;
	}

	return errorData;
}

export function parseErrorResponse(jsonData: unknown): ErrorResponse | null {
	if (!isRecord(jsonData)) {
		return null;
	}

	const errorResponse: Partial<ErrorResponse> = {};

	// Extract statusCode (optional but required for valid ErrorResponse)
	if (hasProperty(jsonData, 'statusCode') && VALIDATORS.number(jsonData.statusCode)) {
		errorResponse.statusCode = jsonData.statusCode;
	}

	// Extract path (optional but required for valid ErrorResponse)
	if (hasProperty(jsonData, 'path') && VALIDATORS.string(jsonData.path)) {
		errorResponse.path = jsonData.path;
	}

	// Extract message (optional but required for valid ErrorResponse)
	if (hasProperty(jsonData, 'message')) {
		if (VALIDATORS.string(jsonData.message)) {
			errorResponse.message = jsonData.message;
		} else if (isStringArray(jsonData.message)) {
			errorResponse.message = jsonData.message;
		}
	}

	// Extract timestamp (optional, will use current timestamp as fallback)
	if (hasProperty(jsonData, 'timestamp') && VALIDATORS.string(jsonData.timestamp)) {
		errorResponse.timestamp = jsonData.timestamp;
	}

	// Extract errorType (optional)
	if (hasProperty(jsonData, 'errorType') && VALIDATORS.string(jsonData.errorType)) {
		errorResponse.errorType = jsonData.errorType;
	}

	// Extract code (error code from server)
	if (hasProperty(jsonData, 'code') && VALIDATORS.string(jsonData.code)) {
		errorResponse.code = jsonData.code;
	}

	// Validate required fields - all must be present for valid ErrorResponse
	if (!errorResponse.statusCode || !errorResponse.path || !errorResponse.message) {
		return null;
	}

	// timestamp is required but might be missing, use current timestamp as fallback
	const timestamp = errorResponse.timestamp ?? new Date().toISOString();

	// All required fields are present, errorResponse satisfies ErrorResponse
	const result: ErrorResponse = {
		statusCode: errorResponse.statusCode,
		path: errorResponse.path,
		message: errorResponse.message,
		timestamp,
		...(errorResponse.errorType && { errorType: errorResponse.errorType }),
		...(errorResponse.code && { code: errorResponse.code }),
	};

	return result;
}

export function parseValidationErrorResponse(jsonData: unknown): ValidationErrorResponse | null {
	if (!isValidationErrorResponse(jsonData)) {
		return null;
	}

	const errorResponse = parseErrorResponse(jsonData);
	if (!errorResponse) {
		return null;
	}

	// isValidationErrorResponse is now a type guard that narrows jsonData
	// It guarantees that jsonData has a valid errors field
	return {
		...errorResponse,
		errors: jsonData.errors,
	};
}

export function isValidationErrorResponse(
	jsonData: unknown
): jsonData is Record<string, unknown> & { errors: string[] | Record<string, string | string[]> } {
	if (!isRecord(jsonData)) {
		return false;
	}

	// Check for errors field with valid validation errors structure
	// Accepts arrays of strings or records mapping field names to error messages
	if (hasProperty(jsonData, 'errors') && isValidValidationErrors(jsonData.errors)) {
		return true;
	}

	return false;
}
