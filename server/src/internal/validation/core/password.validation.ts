/**
 * Password validation utilities (server-only)
 *
 * @module ServerPasswordValidation
 * @description Server-side password validation functions
 */
import { VALIDATION_CONFIG } from '@shared/constants';

import type { PasswordValidationResult } from '@internal/types';

/**
 * Validates password security requirements
 * @param password The password string to validate
 * @returns Password validation result with detailed compliance checks
 * Performs password validation including length requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
	const hasMinLength = Boolean(password && password.length >= VALIDATION_CONFIG.limits.PASSWORD.MIN_LENGTH);
	const hasMaxLength = Boolean(password && password.length <= VALIDATION_CONFIG.limits.PASSWORD.MAX_LENGTH);

	const errors: string[] = [];
	const checks = {
		hasMinLength,
	};

	if (!password || !hasMinLength) {
		errors.push(`Password must be at least ${VALIDATION_CONFIG.limits.PASSWORD.MIN_LENGTH} characters long`);
	}

	if (password && !hasMaxLength) {
		errors.push(`Password must not exceed ${VALIDATION_CONFIG.limits.PASSWORD.MAX_LENGTH} characters`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		checks,
	};
}
