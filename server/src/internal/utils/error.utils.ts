/**
 * Server Error Utilities
 *
 * @module ServerErrorUtils
 * @description Server-specific error handling utilities with NestJS exceptions
 * @used_by server/src/features, server/src/common
 */
import {
	BadRequestException,
	ForbiddenException,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';

import { BasicValue } from '@shared/types';

/**
 * Create validation error for field type validation
 * @param field - The field name
 * @param expectedType - The expected type (string, number, boolean)
 * @returns BadRequestException with validation message
 */
export function createValidationError(field: string, expectedType: BasicValue): BadRequestException {
	return new BadRequestException(`${field} must be a ${expectedType}`);
}

/**
 * Create validation error for string length validation
 * @param field - The field name
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns BadRequestException with validation message
 */
export function createStringLengthValidationError(
	field: string,
	minLength?: number,
	maxLength?: number
): BadRequestException {
	if (minLength && maxLength) {
		return new BadRequestException(`${field} must be between ${minLength} and ${maxLength} characters`);
	}
	if (minLength) {
		return new BadRequestException(`${field} must be at least ${minLength} characters long`);
	}
	if (maxLength) {
		return new BadRequestException(`${field} must be less than ${maxLength} characters`);
	}
	return new BadRequestException(`${field} must be a valid string`);
}

/**
 * Create storage operation error
 * @param operation - The storage operation that failed
 * @param originalError - The original error (optional)
 * @returns InternalServerErrorException with storage error message
 */
export function createStorageError(operation: string, originalError?: unknown): InternalServerErrorException {
	const { getErrorMessage } = require('@shared/utils');
	const message = originalError
		? `Failed to ${operation}: ${getErrorMessage(originalError)}`
		: `Failed to ${operation}`;
	return new InternalServerErrorException(message);
}

/**
 * Create server operation error
 * @param operation - The server operation that failed
 * @param originalError - The original error
 * @returns InternalServerErrorException with server error message
 */
export function createServerError(operation: string, originalError: unknown): InternalServerErrorException {
	const { getErrorMessage } = require('@shared/utils');
	return new InternalServerErrorException(`Failed to ${operation}: ${getErrorMessage(originalError)}`);
}

/**
 * Create not found error
 * @param resource - The resource that was not found
 * @returns NotFoundException with not found message
 */
export function createNotFoundError(resource: string): NotFoundException {
	return new NotFoundException(`${resource} not found`);
}

/**
 * Create cache operation error
 * @param operation - The cache operation that failed
 * @param originalError - The original error (optional)
 * @returns InternalServerErrorException with cache error message
 */
export function createCacheError(operation: string, originalError?: unknown): InternalServerErrorException {
	const { getErrorMessage } = require('@shared/utils');
	const message = originalError
		? `Failed to ${operation}: ${getErrorMessage(originalError)}`
		: `Failed to ${operation}`;
	return new InternalServerErrorException(message);
}

/**
 * Create timeout error
 * @param operation - The operation that timed out
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns InternalServerErrorException with timeout message
 */
export function createTimeoutError(operation: string, timeoutMs?: number): InternalServerErrorException {
	const timeoutText = timeoutMs ? ` after ${timeoutMs}ms` : '';
	return new InternalServerErrorException(`Operation '${operation}' timed out${timeoutText}. Please try again.`);
}

/**
 * Create authentication error
 * @param reason - The reason for authentication failure
 * @returns UnauthorizedException with authentication message
 */
export function createAuthError(reason: string = 'Authentication failed'): UnauthorizedException {
	return new UnauthorizedException(reason);
}

/**
 * Create permission error
 * @param resource - The resource that access was denied to
 * @returns ForbiddenException with permission message
 */
export function createPermissionError(resource: string = 'resource'): ForbiddenException {
	return new ForbiddenException(`Access denied to ${resource}`);
}
