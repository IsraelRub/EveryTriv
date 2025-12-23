/**
 * Password validation utilities (client-side)
 *
 * @module ClientPasswordValidation
 * @description Client-side password validation functions
 */
import { VALIDATION_CONFIG } from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

/**
 * Validates password length requirements
 * @param password The password string to validate
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates password length constraints for client-side validation
 */
export function validatePasswordLength(password: string): BaseValidationResult {
	const errors: string[] = [];

	if (!password) {
		errors.push('Password is required');
	} else {
		if (password.length < VALIDATION_CONFIG.limits.PASSWORD.MIN_LENGTH) {
			errors.push(`Password must be at least ${VALIDATION_CONFIG.limits.PASSWORD.MIN_LENGTH} characters`);
		}
		if (password.length > VALIDATION_CONFIG.limits.PASSWORD.MAX_LENGTH) {
			errors.push(`Password must not exceed ${VALIDATION_CONFIG.limits.PASSWORD.MAX_LENGTH} characters`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validates password confirmation matches
 * @param password The password string
 * @param confirmPassword The confirmation password string
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates that password and confirmation password match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): BaseValidationResult {
	const errors: string[] = [];

	if (!confirmPassword) {
		errors.push('Please confirm your password');
	} else if (password && confirmPassword !== password) {
		errors.push('Passwords do not match');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validates password for form submission
 * @param passwordData Object containing password and optional confirmPassword
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates password length and optional confirmation match
 */
export function validatePasswordForm(passwordData: {
	newPassword: string;
	confirmPassword?: string;
}): BaseValidationResult {
	const lengthValidation = validatePasswordLength(passwordData.newPassword);
	const errors: string[] = [...lengthValidation.errors];

	if (passwordData.confirmPassword !== undefined) {
		const matchValidation = validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword);
		errors.push(...matchValidation.errors);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
