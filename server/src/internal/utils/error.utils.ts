import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';

import { getErrorMessage } from '@shared/utils';

import type { PayPalErrorResponse } from '@internal/types';

import { isErrorWithPayPalResponse } from './guards.utils';

export function createValidationError(field: string, expectedType: string): BadRequestException {
	return new BadRequestException(`${field} must be a ${expectedType}`);
}

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

export function createStorageError(operation: string, originalError?: unknown): InternalServerErrorException {
	const message = originalError
		? `Failed to ${operation}: ${getErrorMessage(originalError)}`
		: `Failed to ${operation}`;
	return new InternalServerErrorException(message);
}

export function createServerError(operation: string, originalError: unknown): InternalServerErrorException {
	return new InternalServerErrorException(`Failed to ${operation}: ${getErrorMessage(originalError)}`);
}

export function createNotFoundError(resource: string): NotFoundException {
	return new NotFoundException(`${resource} not found`);
}

export function createCacheError(operation: string, originalError?: unknown): InternalServerErrorException {
	const message = originalError
		? `Failed to ${operation}: ${getErrorMessage(originalError)}`
		: `Failed to ${operation}`;
	return new InternalServerErrorException(message);
}

export function createAuthError(reason: string = 'Authentication failed'): UnauthorizedException {
	return new UnauthorizedException(reason);
}

export function extractPayPalError(error: unknown): string {
	if (isErrorWithPayPalResponse(error)) {
		if (error.response?.data) {
			const paypalError: PayPalErrorResponse = error.response.data;
			return `${paypalError.name}: ${paypalError.message}`;
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown PayPal API error';
}
