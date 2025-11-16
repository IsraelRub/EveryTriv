/**
 * Password validation utilities
 *
 * @module PasswordValidation
 * @description Validation functions for password security requirements
 */
import { VALIDATION_LIMITS } from '../../constants';
import type { PasswordValidationResult } from '../../types';

/**
 * Validates password security requirements
 * @param password The password string to validate
 * @returns Password validation result with detailed compliance checks
 * Performs comprehensive password validation including length and character type requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumbers = /\d/.test(password);
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
	const hasMinLength = Boolean(password && password.length >= VALIDATION_LIMITS.PASSWORD.MIN_LENGTH);

	const errors: string[] = [];
	const checks = {
		hasMinLength,
		hasUppercase: hasUpperCase,
		hasLowercase: hasLowerCase,
		hasNumber: hasNumbers,
		hasSpecialChar,
	};

	if (!password || !hasMinLength) {
		errors.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD.MIN_LENGTH} characters long`);
	}

	if (password && password.length > VALIDATION_LIMITS.PASSWORD.MAX_LENGTH) {
		errors.push(`Password must not exceed ${VALIDATION_LIMITS.PASSWORD.MAX_LENGTH} characters`);
	}

	if (!hasUpperCase) {
		errors.push('Password must contain at least one uppercase letter');
	}

	if (!hasLowerCase) {
		errors.push('Password must contain at least one lowercase letter');
	}

	if (!hasNumbers) {
		errors.push('Password must contain at least one number');
	}

	if (!hasSpecialChar) {
		errors.push('Password must contain at least one special character');
	}

	return {
		isValid: errors.length === 0,
		errors,
		checks,
	};
}
