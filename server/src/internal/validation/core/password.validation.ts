/**
 * Password validation utilities (server-only)
 *
 * @module ServerPasswordValidation
 * @description Server-side password validation functions
 */
import { VALIDATION_LENGTH } from '@shared/constants';
import type { PasswordValidationResult } from '@internal/types';

/**
 * Validates password security requirements
 * @param password The password string to validate
 * @returns Password validation result with detailed compliance checks
 * Performs password validation including length requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
	const hasMinLength = !!password && password.length >= VALIDATION_LENGTH.PASSWORD.MIN;
	const hasMaxLength = !!password && password.length <= VALIDATION_LENGTH.PASSWORD.MAX;

	const errors: string[] = [];
	const checks = {
		hasMinLength,
	};

	if (!password || !hasMinLength) {
		errors.push(`Password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`);
	}

	if (password && !hasMaxLength) {
		errors.push(`Password must not exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		checks,
	};
}
